# frozen_string_literal: true

module Pawoo::SlackNotifier
  def self.enabled?
    Rails.application.secrets.slack[:webhook_url].present? && Rails.application.secrets.slack[:report_channel].present?
  end

  def self.client(hook_url: Rails.application.secrets.slack[:webhook_url], channel: Rails.application.secrets.slack[:report_channel])
    return unless enabled?

    Slack::Notifier.new(hook_url, channel: channel)
  end
end
