# frozen_string_literal: true

class ScheduledDistributionWorker
  include Sidekiq::Worker

  def perform(status_id)
    old_status = Status.find(status_id)
    new_status = old_status.dup
    new_status.uri = nil

    ApplicationRecord.transaction do
      new_status.save!
      old_status.stream_entry&.update! status: new_status
      old_status.media_attachments.update_all status_id: new_status.id
      new_status.update_attribute(:preview_cards, old_status.preview_cards)
      old_status.pixiv_cards.update_all status_id: new_status.id
      new_status.update_attribute(:tags, old_status.tags)
      old_status.reload
      old_status.destroy!
    end

    # 抽出したハッシュタグを使用するため、ProcessHashtagsServiceの後に実行されなければならない
    ProcessMentionsService.new.call(new_status)

    DistributionWorker.perform_async(new_status.id)
    Pubsubhubbub::DistributionWorker.perform_async(new_status.stream_entry.id)
    ActivityPub::DistributionWorker.perform_async(new_status.id)
    ActivityPub::ReplyDistributionWorker.perform_async(new_status.id) if new_status.reply? && new_status.thread.account.local?

    time_limit = TimeLimit.from_tags(new_status.tags)
    RemovalWorker.perform_in(time_limit.to_duration, new_status.id) if time_limit
  rescue ActiveRecord::RecordNotFound # rescue in case of race removal of statuses
    nil
  end
end
