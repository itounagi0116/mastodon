# frozen_string_literal: true

module MusicImageCropper
  extend ActiveSupport::Concern

  class_methods do
    def crop_option(crop_size, size)
      %(-gravity center -crop "#{crop_size}x#{crop_size}+0+0" +repage -resize "#{size}x#{size}>" -strip -quality 90)
    end

    private :crop_option
  end

  def min_size(attr_key)
    @min_size ||= begin
      geometry = Paperclip::Geometry.from_file(send(attr_key).queued_for_write[:original])
      [geometry.height, geometry.width].min.to_i
    end
  end
end
