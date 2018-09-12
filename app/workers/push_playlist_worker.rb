# frozen_string_literal: true

class PushPlaylistWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'playlist'

  # TODO: あとで消す
  def perform(_deck, _event, _payload)
    nil
  end
end
