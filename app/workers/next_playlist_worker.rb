# frozen_string_literal: true

class NextPlaylistWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'playlist'

  # TODO: playlistキューを空にしてから消す
  def perform(_deck, _item_id)
    nil
  end
end
