# frozen_string_literal: true

class Pawoo::NotifySuspiciousAccountWorker
  include Sidekiq::Worker
  include RoutingHelper

  sidekiq_options queue: 'push'

  def perform(account_id, reason = '')
    webhook_url = Rails.application.secrets.slack[:webhook_url]
    report_channel = Rails.application.secrets.slack[:report_channel]
    return if webhook_url.blank? || report_channel.blank?

    account = Account.find_by(id: account_id)
    return if account.nil?

    client = Slack::Notifier.new(webhook_url, channel: report_channel)
    client.post(username: 'Pawoo 怪しいアカウント', icon_emoji: :warning, text: '', attachments: [build_attachment(account, reason)])
  end

  private

  def build_attachment(account, reason)
    {
      color: 'warning',
      author_name: "#{account.display_name} (@#{account.acct})",
      author_icon: account.avatar.url(:original),
      author_link: admin_account_url(account.id),
      pretext: '怪しいアカウントが検出されたよ',
      fields: reason.present? ? [{ title: '理由', value: reason }] : [],
    }
  end
end
