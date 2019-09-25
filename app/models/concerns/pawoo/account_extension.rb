# frozen_string_literal: true

module Pawoo::AccountExtension
  extend ActiveSupport::Concern
  include RoutingHelper

  BLACKLIST_URLS = %w(
    http://badoogirls.com
  ).freeze

  included do
    after_save :check_to_add_blacklisted_url
  end

  private

  def check_to_add_blacklisted_url
    return unless saved_change_to_note?
    return unless local?
    return unless BLACKLIST_URLS.any? { |blacklist_url| note.include?(blacklist_url) }

    webhook_url = Rails.application.secrets.slack[:webhook_url]
    report_channel = Rails.application.secrets.slack[:report_channel]
    return if webhook_url.blank? || report_channel.blank?

    client = Slack::Notifier.new(webhook_url, channel: report_channel)
    client.post(username: 'Pawoo プロフィール検知', icon_emoji: :warning, text: '', attachments: [build_attachment])
  end

  def build_attachment
    {
      color: 'warning',
      author_name: "#{display_name} (@#{acct})",
      author_icon: avatar.url(:original),
      author_link: admin_account_url(id),
      pretext: 'プロフィールに怪しいURLが設定されたよ',
    }
  end
end
