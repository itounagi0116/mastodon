# frozen_string_literal: true

module Pawoo::AccountExtension
  extend ActiveSupport::Concern

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

    Pawoo::NotifySuspiciousAccountWorker.perform_async(id, 'プロフィールに怪しいURLが設定された')
  end
end
