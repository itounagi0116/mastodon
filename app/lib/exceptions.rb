# frozen_string_literal: true

module Mastodon
  class Error < StandardError; end
  class NotPermittedError < Error; end
  class ValidationError < Error; end
  class RaceConditionError < Error; end
  class MusicConvertError < Error; end
  class MusicSourceNotFoundError < Error; end
  class MusicSourceForbiddenError < Error; end
  class MusicSourceFetchFailedError < Error; end
  class PlayerControlLimitError < Error; end
  class PlayerControlSkipLimitTimeError < Error; end
  class PlaylistWriteProtectionError < Error; end
  class PlaylistSizeOverError < Error; end
  class PlaylistItemNotFoundError < Error; end
  class RedisMaxRetryError < Error; end
  class TrackNotFoundError < Error; end

  class MusicvideoError < MusicConvertError; end
  class FFmpegError < MusicConvertError; end

  class UnexpectedResponseError < Error
    def initialize(response = nil)
      if response.respond_to? :uri
        super("#{response.uri} returned code #{response.code}")
      else
        super
      end
    end
  end
end
