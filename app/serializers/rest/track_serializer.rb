# frozen_string_literal: true

class REST::TrackSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :title, :artist, :text, :content, :video, :albums_count
  has_many :reactions, serializer: REST::ReactionSerializer

  def content
    Formatter.instance.format_for_music(object)
  end

  def video
    hash = {
      backgroundcolor: object.video_backgroundcolor,
      sprite: sprite,
      blur: blur,
      particle: particle,
      lightleaks: lightleaks,
      spectrum: spectrum,
      text: text_param,
      banner: banner,
    }

    if owner_or_admin?
      if object.video.present?
        hash[:url_720x720] = full_asset_url(object.video.url(:original))
      end

      if object.video_1920x1080.present?
        hash[:url_1920x1080] = full_asset_url(object.video_1920x1080.url(:original))
      end
    end

    if object.video_image.present?
      hash[:image] = full_asset_url(object.video_image.url(:small))
      hash[:original_image] = full_asset_url(object.video_image.url(:original))
    end

    hash
  end

  def sprite
    hash = {}

    if (object.video_sprite_movement_circle_rad != 0 || object.video_sprite_movement_circle_scale != 0) &&
       object.video_sprite_movement_circle_speed != 0
      hash[:circle] = {
        rad: object.video_sprite_movement_circle_rad,
        scale: object.video_sprite_movement_circle_scale,
        speed: object.video_sprite_movement_circle_speed,
      }
    end

    if object.video_sprite_movement_random_scale != 0 && object.video_sprite_movement_random_speed != 0
      hash[:random] = {
        scale: object.video_sprite_movement_random_scale,
        speed: object.video_sprite_movement_random_speed,
      }
    end

    if object.video_sprite_movement_zoom_scale != 0 && object.video_sprite_movement_zoom_speed != 0
      hash[:zoom] = {
        scale: object.video_sprite_movement_zoom_scale,
        speed: object.video_sprite_movement_zoom_speed,
      }
    end

    { movement: hash }
  end

  def blur
    {
      visible: object.video_blur_movement_band_top != 0 && object.video_blur_blink_band_top != 0,
      movement: {
        band: {
          top: object.video_blur_movement_band_top,
          bottom: object.video_blur_movement_band_bottom,
        },
        threshold: object.video_blur_movement_threshold,
      },
      blink: {
        band: {
          top: object.video_blur_blink_band_top,
          bottom: object.video_blur_blink_band_bottom,
        },
        threshold: object.video_blur_blink_threshold,
      },
    }
  end

  def particle
    {
      visible: object.video_particle_alpha != 0,
      limit: {
        band: {
          top: object.video_particle_limit_band_top,
          bottom: object.video_particle_limit_band_bottom,
        },
        threshold: object.video_particle_limit_threshold,
      },
      alpha: object.video_particle_alpha,
      color: object.video_particle_color,
    }
  end

  def lightleaks
    {
      visible: object.video_lightleaks_alpha != 0,
      alpha: object.video_lightleaks_alpha,
      interval: object.video_lightleaks_interval,
    }
  end

  def spectrum
    {
      visible: object.video_spectrum_alpha != 0,
      mode: object.video_spectrum_mode,
      alpha: object.video_spectrum_alpha,
      color: object.video_spectrum_color,
    }
  end

  def text_param
    {
      visible: object.video_text_alpha != 0,
      alpha: object.video_text_alpha,
      color: object.video_text_color,
    }
  end

  def banner
    {
      visible: object.video_banner_alpha != 0,
      alpha: object.video_banner_alpha,
    }
  end

  def owner_or_admin?
    current_user && (current_user.admin || instance_options[:account] == current_user.account)
  end
end
