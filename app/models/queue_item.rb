# frozen_string_literal: true

class QueueItem
  include ActiveModel::Model
  include ActiveModel::Serialization

  attr_accessor :id, :info, :thumbnail_url, :music_url, :video_url, :duration, :link, :source_type, :source_id, :account_id

  # source_idは文字列とする
  def source_id=(value)
    @source_id = ActiveModel::Type.lookup(:string).cast(value)
  end

  class << self
    include RoutingHelper

    YOUTUBE_API_KEY = ENV['YOUTUBE_API_KEY']

    def create_from_link(link, account)
      link = link.strip.split(/\s/).try(:[], 0)
      raise Mastodon::MusicSourceNotFoundError if link.blank? || addressable_link(link).nil?

      item = pawoo_link(link) || booth_link(link) || apollo_link(link) || youtube_link(link) || soundcloud_link(link)
      raise Mastodon::MusicSourceNotFoundError unless item

      item.tap do |i|
        i.assign_attributes(
          id: SecureRandom.uuid,
          account_id: account.id
        )
      end
    end

    private

    def addressable_link(link)
      Addressable::URI.parse(link)
    rescue
      nil
    end

    def pawoo_link(link)
      status_id = find_status_id(link)
      return unless status_id

      cache = find_cache('pawoo-music', status_id)
      return cache if cache

      status = Status.find_by(id: status_id, music_type: 'Track', visibility: [:public, :unlisted])
      raise Mastodon::MusicSourceFetchFailedError if status.nil?

      item = new(
        info: status.music.display_title,
        thumbnail_url: status.music.video_image.present? ? full_asset_url(status.music.video_image.url(:small)) : ApplicationController.helpers.asset_pack_path('pawoo_music/default_artwork.png', protocol: :request),
        music_url: full_asset_url(status.music.music.url(:original)),
        video_url: nil,
        link: link,
        duration: status.music.duration,
        source_type: 'pawoo-music',
        source_id: status_id
      )

      cache_item('pawoo-music', status_id, item)
    end

    def find_status_id(link)
      matched = link.match(%r{https?://#{Rails.configuration.x.local_domain}/((@\w+)|(web/statuses))/(?<status_id>\d+)})
      matched ? matched[:status_id] : nil
    end

    def apollo_link(link)
      shop_id = BoothUrl.extract_apollo_item_id(link)
      return unless shop_id

      cache = find_cache('apollo', shop_id)
      return cache if cache

      instance = from_booth_api(shop_id)
      instance.assign_attributes(
        link: link,
        source_type: 'apollo'
      )

      cache_item('apollo', shop_id, instance)
    end

    def booth_link(link)
      shop_id = BoothUrl.extract_booth_item_id(link)
      return unless shop_id

      cache = find_cache('booth', shop_id)
      return cache if cache

      instance = from_booth_api(shop_id)
      instance.assign_attributes(
        link: link,
        source_type: 'booth'
      )

      cache_item('booth', shop_id, instance)
    end

    def from_booth_api(id)
      code, json = BoothApiClient.new.item(id)
      raise Mastodon::MusicSourceFetchFailedError if code != 200 || json.dig('body', 'sound').nil? || json.dig('body', 'adult')

      user_or_shop_name = json.dig('body', 'shop', 'user', 'nickname') || json.dig('body', 'shop', 'name')

      new(
        info: "#{user_or_shop_name} - #{json.dig('body', 'name')}",
        thumbnail_url: json.dig('body', 'primary_image', 'url'),
        music_url: json.dig('body', 'sound', 'long_url'),
        video_url: nil,
        duration: json.dig('body', 'sound', 'duration'),
        source_id: id
      )
    end

    def youtube_link(link)
      video_id = find_youtube_id(link)
      return unless video_id

      cache = find_cache('youtube', video_id)
      return cache if cache

      title = fetch_youtube_title(link)
      duration_sec = fetch_youtube_duration(video_id)

      item = new(
        info: title,
        thumbnail_url: nil,
        music_url: nil,
        video_url: link,
        link: link,
        duration: duration_sec,
        source_type: 'youtube',
        source_id: video_id
      )
      cache_item('youtube', video_id, item)
    end

    def fetch_youtube_duration(video_id)
      url = "https://www.googleapis.com/youtube/v3/videos?key=#{YOUTUBE_API_KEY}&part=contentDetails&id=#{video_id}"
      json = JSON.parse(Request.new(:get, url).perform.body.to_s)
      raise Mastodon::MusicSourceFetchFailedError if json['items'].blank?

      item = json['items'].first
      duration = item['contentDetails']['duration']
      matched = duration.match(%r{PT(\d+H)?(\d+M)?(\d+S)?})
      raise Mastodon::MusicSourceFetchFailedError unless matched

      hour = matched[1]&.slice(/\d+/)&.to_i || 0
      minute = matched[2]&.slice(/\d+/)&.to_i || 0
      second = matched[3]&.slice(/\d+/)&.to_i || 0

      second + minute * 60 + hour * 60 * 60
    end

    def fetch_youtube_title(link)
      url = "https://www.youtube.com/oembed?url=#{link}"
      response = Request.new(:get, url).perform

      raise Mastodon::MusicSourceForbiddenError if response.status == 401
      raise Mastodon::MusicSourceFetchFailedError unless response.status == 200

      json = JSON.parse(response.body.to_s)
      json['title']
    end

    def find_youtube_id(link)
      addressable = addressable_link(link)

      if addressable.hostname == 'www.youtube.com' && addressable.path == '/watch'
        addressable.query_values['v']
      elsif addressable.hostname == 'youtu.be' && addressable.path.match?(%r{\A/[^/^?]+})
        addressable.path.remove(%r{\A/})
      end
    end

    def soundcloud_link(link)
      source_link = find_soundcloud_link(link)
      return unless source_link

      cache = find_cache('soundcloud', source_link)
      return cache if cache

      instance = from_soundcloud_api(link)
      instance.assign_attributes(
        link: link,
        source_type: 'soundcloud'
      )

      cache_item('soundcloud', instance.source_id, instance)
    end

    def find_soundcloud_link(link)
      addressable = addressable_link(link)
      link.remove(%r{\?\Z}) if addressable.hostname == 'soundcloud.com'
    end

    def from_soundcloud_api(link)
      url = "https://soundcloud.com/oembed?format=json&url=#{link}"
      response = Request.new(:get, url).perform
      raise Mastodon::MusicSourceForbiddenError if response.status == 403
      raise Mastodon::MusicSourceFetchFailedError unless response.status == 200

      json = JSON.parse(response.body.to_s)
      title = "#{json['author_name']} - #{json['title'].remove(%r{\sby\s.+?$})}"
      source_id = json['html'].match(%r{https%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F(?<id>\d+)}).try(:[], :id)
      duration_sec = find_soundcloud_duration(json['html'])

      new(
        info: title,
        thumbnail_url: json['thumbnail_url'].gsub('http://', 'https://'),
        music_url: nil,
        video_url: nil,
        duration: duration_sec,
        source_id: source_id
      )
    end

    def find_soundcloud_duration(embed)
      embed_src_pattern = %r{(?<url>https://w\.soundcloud\.com/player/\?.+?&?url=https%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F\d+(?:&show_artwork=true)?)}
      url = embed.match(embed_src_pattern).try(:[], :url)
      response = Request.new(:get, url).perform
      raise Mastodon::MusicSourceFetchFailedError unless response.status == 200

      duration_pattern = %r{full_duration.+?(?<duration>\d+)}
      (response.body.to_s.match(duration_pattern).try(:[], :duration).to_i / 1000).ceil
    end

    def find_cache(type, source_id)
      cache = redis.get("music:link:#{type}:#{source_id}")
      cache ? new(JSON.parse(cache, symbolize: true)) : nil
    end

    def cache_item(type, source_id, item)
      redis.setex("music:link:#{type}:#{source_id}", 3600, item.to_json)
      item
    end

    def redis
      Redis.current
    end
  end
end
