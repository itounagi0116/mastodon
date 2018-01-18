# frozen_string_literal: true

class REST::ReactionSerializer < ActiveModel::Serializer
  attributes :accounts_count, :text
  attribute :reacted, if: :current_user?

  def current_user?
    !current_user.nil?
  end

  def reacted
    object.accounts.where(id: current_user.account).exists?
  end
end
