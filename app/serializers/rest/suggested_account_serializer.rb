# frozen_string_literal: true

class REST::SuggestedAccountSerializer < REST::AccountSerializer
  has_many :media_attachments, serializer: REST::MediaAttachmentSerializer

  def media_attachments
    object.popular_media_attachments
  end
end
