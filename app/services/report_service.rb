# frozen_string_literal: true

class ReportService < BaseService
  def call(source_account, target_account, options = {})
    @source_account = source_account
    @target_account = target_account
    @status_ids     = options.delete(:status_ids) || []
    @comment        = options.delete(:comment) || ''
    @options        = options

    create_report!

    # 管理者権限を持つ全てのアカウントにメールが送信されるため一旦無効化
    # notify_staff!
    notify_to_slack!

    forward_to_origin! if !@target_account.local? && ActiveModel::Type::Boolean.new.cast(@options[:forward])

    @report
  end

  private

  def create_report!
    @report = @source_account.reports.create!(
      target_account: @target_account,
      status_ids: @status_ids,
      comment: @comment,
      action_taken: true,
      pawoo_report_type: @options[:pawoo_report_type],
      pawoo_report_targets: pawoo_report_targets
    )
  end

  def notify_staff!
    User.staff.includes(:account).each do |u|
      AdminMailer.new_report(u.account, @report).deliver_later
    end
  end

  def notify_to_slack!
    webhook_url = Rails.application.secrets.slack[:webhook_url]
    report_channel = Rails.application.secrets.slack[:report_channel]
    return if webhook_url.blank? || report_channel.blank?
    return unless @options[:pawoo_report_type].to_s == 'spam'

    attachments = []
    @report.pawoo_report_targets.each do |pawoo_report_target|
      count = Pawoo::ReportTarget.where(state: :unresolved, target: pawoo_report_target.target).size
      next if count < 2 || count > 5

      case pawoo_report_target.target_type
      when 'Status'
        attachments << build_status_attachment(pawoo_report_target.target, count)
      when 'Account'
        attachments << build_account_attachment(pawoo_report_target.target, count)
      end
    end

    return if attachments.blank?

    client = Slack::Notifier.new(webhook_url, channel: report_channel)
    client.post(username: 'Pawoo通報', icon_emoji: :warning, text: '', attachments: attachments)
  end

  def build_base_attachment(account, count)
    {
      color: '#ff9800',
      author_name: "#{account.display_name} (@#{account.acct})",
      author_icon: account.avatar.url(:original),
      author_link: admin_account_url(account.id),
      fields: build_fields(count),
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

  def build_fields(count)
    fields = [
      {
        title: '通報のカテゴリ',
        value: I18n.t("pawoo.admin.report_targets.report_type.#{@options[:pawoo_report_type] || 'other'}"),
        short: true,
      },
      {
        title: '通報回数',
        value: count,
        short: true,
      },
    ]

    fields.push(title: '理由', value: @comment) if @comment.present?

    fields
  end

  def build_status_attachment(status, count)
    build_base_attachment(status.account, count).tap do |base|
      base[:fallback] = 'トゥートが通報されたよ'
      base[:pretext] = 'トゥートが通報されたよ'
      base[:actions] << {
        type: 'button',
        text: 'トゥートを見る(Web)',
        url: TagManager.instance.url_for(status),
      }
    end
  end

  def build_account_attachment(account, count)
    build_base_attachment(account, count).tap do |base|
      base[:fallback] = 'アカウントが通報されたよ'
      base[:pretext] = 'アカウントが通報されたよ'
    end
  end

  def forward_to_origin!
    ActivityPub::DeliveryWorker.perform_async(
      payload,
      some_local_account.id,
      @target_account.inbox_url
    )
  end

  def payload
    Oj.dump(ActiveModelSerializers::SerializableResource.new(
      @report,
      serializer: ActivityPub::FlagSerializer,
      adapter: ActivityPub::Adapter,
      account: some_local_account
    ).as_json)
  end

  def some_local_account
    @some_local_account ||= Account.local.where(suspended: false).first
  end

  def pawoo_report_targets
    return [] if @options[:pawoo_report_type].to_s == 'donotlike'

    if @status_ids.present?
      status_ids = @status_ids
      resolved_target_ids = Pawoo::ReportTarget.where(state: :resolved, target_type: 'Status', target_id: status_ids).distinct(:target_id).pluck(:target_id)
      status_ids -= resolved_target_ids

      if @options[:pawoo_report_type].to_s == 'nsfw'
        nsfw_status_ids = Status.where(sensitive: true, id: status_ids).pluck(:id)
        status_ids -= nsfw_status_ids
      end

      status_ids.map do |status_id|
        Pawoo::ReportTarget.new(target_type: 'Status', target_id: status_id, state: :unresolved)
      end
    else
      [Pawoo::ReportTarget.new(target: @target_account)]
    end
  end
end
