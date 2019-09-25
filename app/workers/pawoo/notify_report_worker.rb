# frozen_string_literal: true

class Pawoo::NotifyReportWorker
  include Sidekiq::Worker
  include RoutingHelper

  sidekiq_options queue: 'push', unique: :until_executed

  def perform(report_id)
    webhook_url = Rails.application.secrets.slack[:webhook_url]
    report_channel = Rails.application.secrets.slack[:report_channel]
    return if webhook_url.blank? || report_channel.blank?

    report = Report.preload(pawoo_report_targets: :target).find_by(id: report_id)
    return if report.nil?

    attachments = build_attachments(report)
    return if attachments.blank?

    client = Slack::Notifier.new(webhook_url, channel: report_channel)
    client.post(username: 'Pawoo 通報', icon_emoji: :rotating_light, text: '', attachments: attachments)
  end

  private

  def build_attachments(report)
    attachments = []
    report.pawoo_report_targets.each do |pawoo_report_target|
      count = Pawoo::ReportTarget.joins(:report).where(state: :unresolved, target: pawoo_report_target.target)
                                 .merge(Report.where(pawoo_report_type: report.pawoo_report_type)).size
      next if count < 2 || count > 5

      case pawoo_report_target.target_type
      when 'Status'
        attachments << build_status_attachment(report, pawoo_report_target.target, count)
      when 'Account'
        attachments << build_account_attachment(report, pawoo_report_target.target, count)
      end
    end

    attachments
  end

  def build_base_attachment(report, account, count)
    {
      color: 'danger',
      author_name: "#{account.display_name} (@#{account.acct})",
      author_icon: account.avatar.url(:original),
      author_link: admin_account_url(account.id),
      fields: build_fields(report, count),
      actions: [
        {
          type: 'button',
          text: '通報一覧を見る',
          url: admin_pawoo_report_targets_url,
        },
        {
          type: 'button',
          text: 'アカウントを見る(管理画面)',
          url: admin_account_url(account.id),
        },
      ],
    }
  end

  def build_fields(report, count)
    fields = [
      {
        title: '通報のカテゴリ',
        value: I18n.with_locale(:ja) { I18n.t("pawoo.admin.report_targets.report_type.#{report.pawoo_report_type}") },
        short: true,
      },
      {
        title: '通報回数',
        value: count,
        short: true,
      },
    ]

    fields.push(title: '理由', value: report.comment) if report.comment.present?

    fields
  end

  def build_status_attachment(report, status, count)
    build_base_attachment(report, status.account, count).tap do |base|
      base[:fallback] = 'トゥートが通報されたよ'
      base[:pretext] = 'トゥートが通報されたよ'
      base[:actions] << {
        type: 'button',
        text: 'トゥートを見る(Web)',
        url: TagManager.instance.url_for(status),
      }
    end
  end

  def build_account_attachment(report, account, count)
    build_base_attachment(report, account, count).tap do |base|
      base[:fallback] = 'アカウントが通報されたよ'
      base[:pretext] = 'アカウントが通報されたよ'
    end
  end
end
