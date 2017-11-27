# frozen_string_literal: true

class PostNowPlayingService < BaseService
  def call(playlist_log)
    @playlist_log = playlist_log
    account = Account.find_local!('now_playing')
    application = Doorkeeper::Application.find_by!(name: 'Now playing')

    text = [
      deck_name,
      "#{@playlist_log.info} (via #{@playlist_log.link} )",
      "#ch#{@playlist_log.deck}",
      request_account,
    ].compact.join("\n")

    PostStatusService.new.call(account, text, nil, visibility: 'unlisted', sensitive: false, application: application)
  rescue ActiveRecord::RecordNotFound
    nil
  end

  private

  def deck_name
    deck = @playlist_log.deck
    return 'Pawoo Music' if deck == 346

    "Ch#{deck}"
  end

  def request_account
    account = @playlist_log.account
    return nil unless account

    username = account.display_name.present? ? "#{account.display_name}さん (#{account.username})" : "#{account.username}さん"
    "----\nリクエスト: #{username}"
  end
end
