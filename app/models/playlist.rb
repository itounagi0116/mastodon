# frozen_string_literal: true
# == Schema Information
#
# Table name: playlists
#
#  id            :integer          not null, primary key
#  deck          :integer          not null
#  name          :string           default(""), not null
#  deck_type     :integer          default("normal"), not null
#  write_protect :boolean          default(FALSE), not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#

class Playlist < ApplicationRecord
  validates :deck, uniqueness: true, presence: true

  after_destroy :remove_queue_items

  enum deck_type: { normal: 0, apollo: 1 }

  MEDIA_TL_DECK_ID = 346 # Pawoo Musicに投稿された曲が自動的に追加されるDECK(手動での追加はできない)

  def add(link, account, force = false)
    raise Mastodon::PlaylistWriteProtectionError if write_protect && !force

    queue_item = QueueItem.create_from_link(link, account)

    updated_items = update_queue_items(music_add_count_key(account)) do |items|
      raise Mastodon::PlayerControlLimitError if control_limit?(account, force)
      raise Mastodon::PlaylistSizeOverError unless items.size < settings['max_queue_size']

      items.push(queue_item)
    end

    return false unless updated_items

    PushPlaylistWorker.perform_async(deck, 'add', queue_item.as_json)
    PlaylistLog.create(
      account: account,
      uuid: queue_item.id,
      deck: deck,
      link: link,
      info: queue_item.info
    )
    play_item(queue_item.id, queue_item.duration, 0) if updated_items.size == 1
    true
  end

  def skip(id, account)
    skip_count_key = music_skip_count_key(account)

    unless account.user.admin
      raise Mastodon::PlayerControlSkipLimitTimeError if current_time_sec < settings['skip_limit_time']
      # 本当はredisに値を入れる前にスキップ回数のチェックをするべき
      raise Mastodon::PlayerControlLimitError unless (redis.get(skip_count_key)&.to_i || 0) < settings['max_skip_count']
    end

    ret = self.next(id, skip_count_key)
    return false unless ret

    PlaylistLog.find_by(uuid: id)&.update(skipped_at: Time.now, skipped_account: account)
    true
  end

  def next(id, incriment_key = nil)
    updated_items = update_queue_items(incriment_key) do |items|
      first_item = items.first
      if first_item && first_item[:id] == id
        items.shift
        items
      else
        raise Mastodon::PlaylistItemNotFoundError
      end
    end

    return false unless updated_items

    PushPlaylistWorker.perform_async(deck, 'end', id: id)
    first_item = updated_items.first

    if first_item
      queue_item = QueueItem.new(first_item)
      play_item(queue_item.id, queue_item.duration)
    else
      # プレイリストが空の場合は、過去に追加された曲をもう一度再生
      replay
    end
    true
  end

  def queue_items
    JSON.parse(redis.get(playlist_key) || '[]', symbolize_names: true)
  end

  def current_time_sec
    start_time = redis.get(start_time_key).to_i
    Time.now.to_i - start_time
  end

  private

  def set_start_time
    redis.set(start_time_key, Time.now.to_i)
  end

  def control_limit?(account, force)
    count = redis.get(music_add_count_key(account))&.to_i || 0
    !account.user.admin && !force && count >= settings['max_add_count']
  end

  def replay
    account = Account.find_local('pixiv')
    return unless account

    playlist_links = PlaylistLog.where(deck: deck).where.not(account: account).order(id: :desc).limit(settings['replay_history_num']).pluck(:link)

    playlist_links.uniq.shuffle.each do |link|
      begin
        break if add(link, account, true)
      rescue Mastodon::MusicSourceNotFoundError, Mastodon::MusicSourceFetchFailedError, Mastodon::MusicSourceForbiddenError
        next
      end
    end
  end

  def play_item(queue_item_id, duration, gap = 10)
    set_start_time
    NextPlaylistWorker.perform_in(duration + gap, deck, queue_item_id)
    PushPlaylistWorker.perform_async(deck, 'play', id: queue_item_id)
    PlaylistLog.find_by(uuid: queue_item_id)&.update(started_at: Time.now)
  end

  def playlist_key
    "music:playlist:#{deck}"
  end

  def start_time_key
    "music:playlist:time:#{deck}"
  end

  def update_queue_items(incriment_key = nil, retry_count = 3)
    watch_keys = [playlist_key, incriment_key].compact
    while retry_count.positive?
      redis.watch(*watch_keys) do
        begin
          items = yield queue_items
          return nil unless items

          ttl = nil
          if incriment_key
            ttl = redis.ttl(incriment_key)
            ttl = 60 * 60 if ttl <= 0
          end

          res = redis.multi do |m|
            m.set(playlist_key, items.to_json)
            if incriment_key && ttl
              m.incr(incriment_key)
              m.expire(incriment_key, ttl)
            end
          end

          return items if res
        ensure
          redis.unwatch
        end
      end
      retry_count -= 1
    end
    raise Mastodon::RedisMaxRetryError
  end

  def music_add_count_key(account)
    "music:playlist:add-count:#{account.id}"
  end

  def music_skip_count_key(account)
    "music:playlist:skip-count:#{account.id}"
  end

  def redis
    Redis.current
  end

  def remove_queue_items
    redis.del(playlist_key)
  end

  def settings
    @settings ||= Setting.playlist
  end
end
