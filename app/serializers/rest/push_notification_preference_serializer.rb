# frozen_string_literal: true

class REST::PushNotificationPreferenceSerializer < ActiveModel::Serializer
  attributes :notification_firebase_cloud_messagings, :interactions

  def notification_firebase_cloud_messagings
    object['notification_firebase_cloud_messagings']
  end

  def interactions
    object['interactions']
  end
end
