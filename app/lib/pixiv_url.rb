# frozen_string_literal: true

module PixivUrl
  PIXIV_URLS = {
    'www.pixiv.net' => [
      '/member_illust.php',
      %r{\A/artworks/\d+\z},
      %r{\A/en/artworks/\d+\z},
      '/novel/show.php',
    ].freeze,
  }.freeze

  PIXIV_IMAGE_HOSTS = %w(
    i.pximg.net
    embed.pixiv.net
  ).freeze

  def self.valid_pixiv_url?(url)
    return false if url.blank?

    uri = Addressable::URI.parse(url)
    (PIXIV_URLS[uri.host] || []).any? { |path| path === uri.path } # rubocop:disable Style/CaseEquality
  rescue Addressable::URI::InvalidURIError, TypeError
    false
  end

  def self.valid_pixiv_image_url?(url)
    return false if url.blank?

    uri = Addressable::URI.parse(url)
    PIXIV_IMAGE_HOSTS.include?(uri.host)
  rescue Addressable::URI::InvalidURIError, TypeError
    false
  end
end
