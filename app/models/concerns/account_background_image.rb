# frozen_string_literal: true

module AccountBackgroundImage
  extend ActiveSupport::Concern

  IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'].freeze

  included do
    # BackgroundImage upload
    has_attached_file :background_image, styles: { original: '' }, convert_options: { all: '-quality 90 -strip' }
    validates_attachment_content_type :background_image, content_type: IMAGE_MIME_TYPES
    validates_attachment_size :background_image, less_than: 2.megabytes
  end

  def background_image_original_url
    background_image.url(:original)
  end
end
