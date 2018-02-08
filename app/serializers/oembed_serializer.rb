# frozen_string_literal: true

class OEmbedSerializer < ActiveModel::Serializer
  include RoutingHelper
  include ActionView::Helpers::TagHelper

  attributes :type, :version, :title, :author_name,
             :author_url, :provider_name, :provider_url,
             :cache_age, :html, :width, :height

  def type
    if object.music.present?
      'video'
    else
      'rich'
    end
  end

  def version
    '1.0'
  end

  def author_name
    object.account.display_name.presence || object.account.username
  end

  def author_url
    short_account_url(object.account)
  end

  def provider_name
    Rails.configuration.x.local_domain
  end

  def provider_url
    root_url
  end

  def cache_age
    86_400
  end

  def html
    return music_html if object.music.present?

    attributes = {
      src: embed_short_account_status_url(object.account, object, extra_params),
      class: 'mastodon-embed',
      style: 'max-width: 100%; border: 0',
      width: width,
      height: height,
    }

    content_tag(:iframe, nil, attributes) + content_tag(:script, nil, src: full_asset_url('embed.js', skip_pipeline: true), async: true)
  end

  def width
    instance_options[:width]
  end

  def height
    instance_options[:height]
  end

  def extra_params
    instance_options[:extra_params] || {}
  end

  private

  def music_html
    content_tag(:iframe, nil, {
      src: embed_short_account_status_url(object.account, object, extra_params),
      style: 'border: 0',
      width: width,
      height: height,
    })
  end
end
