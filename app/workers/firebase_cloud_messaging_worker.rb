# frozen_string_literal: true

class FirebaseCloudMessagingWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'push'

  def perform(notification_id, recipient_id)
    @notification = Notification.find(notification_id)
    @recipient = Account.find(recipient_id)

    I18n.with_locale(@recipient.user.locale || I18n.default_locale) do
      send_push_notifications
    end
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def send_push_notifications
    data = InlineRenderer.render(@notification, @recipient, :firebase_cloud_messaging_push_notification)

    @recipient.user.firebase_cloud_messaging_tokens.each do |firebase_cloud_messaging_token|
      method_name = if firebase_cloud_messaging_token.android?
                      :publish_to_android
                    else
                      :publish_to_ios
                    end

      FirebaseCloudMessagingApi.public_send(method_name, firebase_cloud_messaging_token.token, data)
    end
  end
end
