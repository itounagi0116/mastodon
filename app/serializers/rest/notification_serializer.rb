# frozen_string_literal: true

class REST::NotificationSerializer < ActiveModel::Serializer
  attributes :id, :type, :created_at

  belongs_to :from_account, key: :account, serializer: REST::AccountSerializer
  belongs_to :target_status, key: :status, if: :status_type?, serializer: REST::StatusSerializer
  belongs_to :video_preparation_success, key: :status, if: :video_preparation_success?, serializer: REST::StatusSerializer
  belongs_to :video_preparation_error, key: :status, if: :video_preparation_error?, serializer: REST::StatusSerializer

  def status_type?
    [:favourite, :reblog, :mention].include?(object.type)
  end

  def video_preparation_success?
    object.type == :video_preparation_success
  end

  def video_preparation_error?
    object.type == :video_preparation_error
  end

  def video_preparation_success
    object.activity.statuses.find_by!(reblog: nil)
  end

  def video_preparation_error
    object.activity.track.statuses.find_by!(reblog: nil)
  end
end
