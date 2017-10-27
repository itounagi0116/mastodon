attributes :id, :created_at, :in_reply_to_id,
           :in_reply_to_account_id, :sensitive,
           :spoiler_text, :visibility, :language

node(:uri)              { |status| TagManager.instance.uri_for(status) }
node(:content)          { |status| Formatter.instance.format(status) }
node(:text)             { |status| Formatter.instance.plaintext(status) }
node(:url)              { |status| TagManager.instance.url_for(status) }
node(:reblogs_count)    { |status| defined?(@reblogs_counts_map)    ? (@reblogs_counts_map[status.id]    || 0) : status.reblogs_count }
node(:favourites_count) { |status| defined?(@favourites_counts_map) ? (@favourites_counts_map[status.id] || 0) : status.favourites_count }
node(:pixiv_cards)      { |status| status.pixiv_cards.select(&:image_url?).map { |record| record.slice(:url, :image_url) }.compact }
node(:pinned)           { |status| status.pinned_status.present? }
node(:booth_item_url)   { |status| BoothUrl.extract_booth_item_url(Formatter.instance.plaintext(status)) }
node(:booth_item_id) do |status|
  text = Formatter.instance.plaintext(status)
  BoothUrl.extract_booth_item_id(text) || BoothUrl.extract_apollo_item_id(text)
end

child :application do
  extends 'api/v1/apps/show'
end

child :account do
  extends 'api/v1/accounts/show'
end

# pawoo iOSが対応していないので、一時的に除外する。🍺 飲みたい
child({ @object.media_attachments.reject(&:unknown?) => :media_attachments }, object_root: false) do
  extends 'api/v1/statuses/_media'
end

child :mentions, object_root: false do
  extends 'api/v1/statuses/_mention'
end

child :tags, object_root: false do
  extends 'api/v1/statuses/_tags'
end

child({ music: :album }, if: ->(status) { !status.reblog? && status.music.is_a?(Album) }) do
  attribute :title, :text
  node(:image) { |album| full_asset_url(album.image.url(:original)) }
end

root_status = root_object
child({ music: :track }, if: ->(status) { !status.reblog? && status.music.is_a?(Track) }) do
  attribute :title, :artist, :text

  node(:content) { |track| Formatter.instance.format_for_track(root_status) }

  node :video do |track|
    hash = {}

    if current_account && root_status.account_id == current_account.id
      if track.video.present?
        hash[:url_720x720] = full_asset_url(track.video.url(:original))
      end

      if track.video_1920x1080.present?
        hash[:url_1920x1080] = full_asset_url(track.video_1920x1080.url(:original))
      end
    end

    if track.video_image.present?
      hash[:image] = full_asset_url(track.video_image.url(:small))
      hash[:original_image] = full_asset_url(track.video_image.url(:original))
    end

    if track.video_blur_movement_band_top != 0 && track.video_blur_blink_band_top != 0
      hash[:blur] = {
        movement: {
          band: {
            top: track.video_blur_movement_band_top,
            bottom: track.video_blur_movement_band_bottom,
          },
          threshold: track.video_blur_movement_threshold,
        },
        blink: {
          band: {
            top: track.video_blur_blink_band_top,
            bottom: track.video_blur_blink_band_bottom,
          },
          threshold: track.video_blur_blink_threshold,
        },
      }
    end

    if track.video_particle_alpha != 0
      hash[:particle] = {
        limit: {
          band: {
            top: track.video_particle_limit_band_top,
            bottom: track.video_particle_limit_band_bottom,
          },
          threshold: track.video_particle_limit_threshold,
        },
        alpha: track.video_particle_alpha,
        color: track.video_particle_color,
      }
    end

    if track.video_lightleaks_alpha != 0
      hash[:lightleaks] = {
        alpha: track.video_lightleaks_alpha,
        interval: track.video_lightleaks_interval,
      }
    end

    if track.video_spectrum_alpha != 0
      hash[:spectrum] = {
        mode: track.video_spectrum_mode,
        alpha: track.video_spectrum_alpha,
        color: track.video_spectrum_color,
      }
    end

    if track.video_text_alpha != 0
      hash[:text] = {
        alpha: track.video_text_alpha,
        color: track.video_text_color,
      }
    end

    hash
  end
end
