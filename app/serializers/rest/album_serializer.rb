# frozen_string_literal: true

class REST::AlbumSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :title, :text, :content, :image, :preview_url, :tracks_count

  def content
    Formatter.instance.format_for_music(object)
  end

  def image
    full_asset_url(object.image.url(:original))
  end

  def preview_url
    full_asset_url(object.image.url(:small))
  end

  def tracks_count
    object.album_tracks.size
  end
end
