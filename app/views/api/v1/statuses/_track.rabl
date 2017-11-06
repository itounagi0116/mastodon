attribute :title, :artist, :text

node(:content) { |track| Formatter.instance.format_for_music(track) }

node :video do |track|
  hash = { backgroundcolor: track.video_backgroundcolor }

  if locals[:show_video_url]
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

  hash[:blur] = {
    visible: track.video_blur_movement_band_top != 0 && track.video_blur_blink_band_top != 0,
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

  hash[:particle] = {
    visible: track.video_particle_alpha != 0,
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

  hash[:lightleaks] = {
    visible: track.video_lightleaks_alpha != 0,
    alpha: track.video_lightleaks_alpha,
    interval: track.video_lightleaks_interval,
  }

  hash[:spectrum] = {
    visible: track.video_spectrum_alpha != 0,
    mode: track.video_spectrum_mode,
    alpha: track.video_spectrum_alpha,
    color: track.video_spectrum_color,
  }

  hash[:text] = {
    visible: track.video_text_alpha != 0,
    alpha: track.video_text_alpha,
    color: track.video_text_color,
  }

  hash[:banner] = {
    visible: track.video_banner_alpha != 0,
    alpha: track.video_banner_alpha,
  }

  hash
end
