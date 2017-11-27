# frozen_string_literal: true

class FirebaseCloudMessaging::PushNotificationSerializer < ActiveModel::Serializer
  attributes :id, :type, :created_at

  belongs_to :account
  belongs_to :from_account
  belongs_to :target_status, key: :status, if: :status_type?

  def status_type?
    [:favourite, :reblog, :mention].include?(object.type)
  end
end

class AccountSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :id, :username, :acct, :display_name, :locked, :created_at, :avatar, :avatar_static

  def avatar
    full_asset_url(object.avatar_original_url)
  end

  def avatar_static
    full_asset_url(object.avatar_static_url)
  end
end

class StatusSerializer < ActiveModel::Serializer
  attributes :id, :created_at, :in_reply_to_id, :in_reply_to_account_id, :sensitive, :spoiler_text, :visibility, :content

  def content
    Formatter.instance.plaintext(object)
  end
end
