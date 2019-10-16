# frozen_string_literal: true

class Pawoo::NotifySuspiciousAccountWorker
  include Sidekiq::Worker
  include RoutingHelper

  sidekiq_options queue: 'push', unique: :until_executed

  def perform(account_id, reason = '')
    return unless Pawoo::SlackNotifier.enabled?

    account = Account.find_by(id: account_id)
    return if account.nil?

    client = Pawoo::SlackNotifier.client
    client&.post(username: 'Pawoo 怪しいアカウント', icon_emoji: :warning, text: '', attachments: [build_attachment(account, reason)])
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
