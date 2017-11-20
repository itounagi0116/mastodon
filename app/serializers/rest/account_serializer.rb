# frozen_string_literal: true

class REST::AccountSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :id, :username, :acct, :display_name, :locked, :created_at,
             :note, :url, :avatar, :avatar_static, :header, :header_static,
             :followers_count, :following_count, :statuses_count, :tracks_count, :albums_count

  belongs_to :oauth_authentications
  has_many :popular_media_attachments, serializer: REST::MediaAttachmentSerializer, if: :show_with_media?
  has_one :custom_color

  def note
    Formatter.instance.simplified_format(object)
  end

  def url
    TagManager.instance.url_for(object)
  end

  def avatar
    full_asset_url(object.avatar_original_url)
  end

  def avatar_static
    full_asset_url(object.avatar_static_url)
  end

  def header
    full_asset_url(object.header_original_url)
  end

  def header_static
    full_asset_url(object.header_static_url)
  end

  def show_with_media?
    instance_options[:show_with_media]
  end

  class OauthAuthenticationSerializer < ActiveModel::Serializer
    attributes :uid, :provider
  end

  class CustomColorSerializer < ActiveModel::Serializer
    attributes :textcolor, :linkcolor, :linkcolor2, :strong1, :strong2, :color1, :color2, :color3
  end
end
