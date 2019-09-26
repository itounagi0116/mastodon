# frozen_string_literal: true

module PixivUrl
  PIXIV_URLS = {
    'www.pixiv.net' => %w(
      /member.php
      /member_illust.php
      /novel/show.php
      /novel/member.php
    ),
    'touch.pixiv.net' => %w(
      /member_illust.php
      /novel/member.php
      /novel/show.php
    ),
  }.freeze

  PIXIV_IMAGE_HOSTS = %w(
    i.pximg.net
    embed.pixiv.net
  ).freeze

  def self.valid_pixiv_url?(url)
    return false if url.blank?

    uri = Addressable::URI.parse(url)
    (PIXIV_URLS[uri.host] || []).include?(uri.path)
  rescue Addressable::URI::InvalidURIError, TypeError
    false
  end

  def self.valid_twitter_image?(url)
    return false if url.blank?

    uri = Addressable::URI.parse(url)
    PIXIV_IMAGE_HOSTS.include?(uri.host)
  rescue Addressable::URI::InvalidURIError, TypeError
    false
  end
end
