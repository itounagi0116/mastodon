# frozen_string_literal: true

class NotificationMailer < ApplicationMailer
  helper StreamEntriesHelper

  def mention(recipient, notification)
    @me     = recipient
    @status = notification.target_status

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.mention.subject', name: @status.account.acct)
    end
  end

  def follow(recipient, notification)
    @me      = recipient
    @account = notification.from_account

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.follow.subject', name: @account.acct)
    end
  end

  def favourite(recipient, notification)
    @me      = recipient
    @account = notification.from_account
    @status  = notification.target_status

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.favourite.subject', name: @account.acct)
    end
  end

  def reblog(recipient, notification)
    @me      = recipient
    @account = notification.from_account
    @status  = notification.target_status

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.reblog.subject', name: @account.acct)
    end
  end

  def follow_request(recipient, notification)
    @me      = recipient
    @account = notification.from_account

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.follow_request.subject', name: @account.acct)
    end
  end

  def new_track(recipient, notification)
    @me = recipient
    @track = notification.activity
    @status = @track.statuses.find_by!(reblog: nil)

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.new_track.subject', name: @status.account.acct)
    end
  end

  def video_preparation_success(recipient, notification)
    @me = recipient
    @track = notification.activity
    @status = @track.statuses.find_by!(reblog: nil)

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.video_preparation_success.subject', title: @track.title)
    end
  end

  def video_preparation_error(recipient, notification)
    @me = recipient
    @track = notification.activity.track
    @status = @track.statuses.find_by!(reblog: nil)

    locale_for_account(@me) do
      mail to: @me.user.email, subject: I18n.t('notification_mailer.video_preparation_error.subject', title: @track.title)
    end
  end

  def digest(recipient, opts = {})
    @me            = recipient
    @since         = opts[:since] || @me.user.last_emailed_at || @me.user.current_sign_in_at
    @notifications = Notification.where(account: @me, activity_type: 'Mention').where('created_at > ?', @since)
    @follows_since = Notification.where(account: @me, activity_type: 'Follow').where('created_at > ?', @since).count

    return if @notifications.empty?

    locale_for_account(@me) do
      mail to: @me.user.email,
           subject: I18n.t(
             :subject,
             scope: [:notification_mailer, :digest],
             count: @notifications.size
           )
    end
  end
end
