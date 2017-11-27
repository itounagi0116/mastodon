# frozen_string_literal: true

class REST::SearchResultSerializer < ActiveModel::Serializer
  attributes :hits_total

  has_many :statuses, serializer: REST::StatusSerializer

  def statuses
    object[:statuses]
  end

  def hits_total
    object[:hits_total]
  end
end
