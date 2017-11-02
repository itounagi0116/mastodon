# frozen_string_literal: true

class VideoPreparingWorker
  include Sidekiq::Worker

  sidekiq_options queue: :video_preparer, unique_for: 16.minutes, retry: false

  def perform(id, resolution)
    status = Status.tracks_only.find(id)

    video = MusicConvertService.new.call(status.music, resolution)
    begin
      key = case resolution
            when '720x720'
              :video
            when '1920x1080'
              :video_1920x1080
            else
              raise ArgumentError, 'resolution is expected to be 720x720 or 1920x1080, but it was ' + resolution
            end

      status.music.update! key => video
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
    # 再生成の場合は前回の通知を削除する
    Notification.find_by(activity_type: 'Track', activity_id: status.music.id, account: status.account)&.destroy

    NotifyService.new.call(status.account, status.music)
  end
end
