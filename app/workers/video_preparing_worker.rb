# frozen_string_literal: true

class VideoPreparingWorker
  include Sidekiq::Worker

  sidekiq_options queue: :video_preparer, unique_for: 16.minutes, retry: false

  def perform(id)
    status = Status.tracks_only.find(id)

    video = MusicConvertService.new.call(status.music)
    begin
      status.music.update! video: video
    ensure
      video.unlink
    end
  rescue ActiveRecord::RecordNotFound
    nil
  rescue
    Rails.logger.error "failed to convert track id: #{status.music_id}"

    error = VideoPreparationError.create!(track: status.music)
    begin
      NotifyService.new.call(status.account, error)
    rescue => e
      Rails.logger.error e
      error.destroy!
    end

    raise
  else
    # キャッシュにmusicの情報も保存されているためクリアする
    Rails.cache.delete(status.cache_key)

    # 再生成の場合は前回の通知を削除する
    Notification.find_by(activity_type: 'Track', activity_id: status.music.id, account: status.account)&.destroy

    NotifyService.new.call(status.account, status.music)
  end
end
