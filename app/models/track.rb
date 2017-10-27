# == Schema Information
#
# Table name: tracks
#
#  id                               :integer          not null, primary key
#  duration                         :integer          not null
#  title                            :string           not null
#  artist                           :string           not null
#  text                             :string           default(""), not null
#  music_file_name                  :string
#  music_content_type               :string
#  music_file_size                  :integer
#  music_updated_at                 :datetime
#  video_file_name                  :string
#  video_content_type               :string
#  video_file_size                  :integer
#  video_updated_at                 :datetime
#  video_image_file_name            :string
#  video_image_content_type         :string
#  video_image_file_size            :integer
#  video_image_updated_at           :datetime
#  video_blur_movement_band_bottom  :integer          default(0), not null
#  video_blur_movement_band_top     :integer          default(0), not null
#  video_blur_movement_threshold    :integer          default(0), not null
#  video_blur_blink_band_bottom     :integer          default(0), not null
#  video_blur_blink_band_top        :integer          default(0), not null
#  video_blur_blink_threshold       :integer          default(0), not null
#  video_particle_limit_band_bottom :integer          default(0), not null
#  video_particle_limit_band_top    :integer          default(0), not null
#  video_particle_limit_threshold   :integer          default(0), not null
#  video_particle_alpha             :float            default(0.0), not null
#  video_particle_color             :integer          default(0), not null
#  video_lightleaks_alpha           :float            default(0.0), not null
#  video_lightleaks_interval        :integer          default(0), not null
#  video_spectrum_mode              :integer          default(0), not null
#  video_spectrum_alpha             :float            default(0.0), not null
#  video_spectrum_color             :integer          default(0), not null
#  video_text_alpha                 :float            default(0.0), not null
#  video_text_color                 :integer          default(0), not null
#  view_count                       :integer          default(0), not null
#  video_1920x1080_file_name        :string
#  video_1920x1080_content_type     :string
#  video_1920x1080_file_size        :integer
#  video_1920x1080_updated_at       :datetime
#

class Track < ApplicationRecord
  RESOLUTIONS = ['720x720', '1920x1080'].freeze

  include Paginable
  include MusicImageCropper

  before_save :truncate_title,       if: :title_changed?
  before_save :truncate_artist,      if: :artist_changed?

  has_many :album_tracks, inverse_of: :track
  has_many :statuses, as: :music
  has_many :video_preparation_errors, inverse_of: :track, dependent: :destroy
  has_one :notification, as: :activity, dependent: :destroy

  has_attached_file :music
  has_attached_file :video
  has_attached_file :video_1920x1080
  has_attached_file :video_image,
    styles: { original: '', small: '' },
    convert_options: {
      original: '-strip -quality 90',
      small: ->(instance) { crop_option(instance.min_size(:video_image), '600') },
    }

  validates :title, presence: true
  validates :artist, presence: true

  validates_attachment :music,
                       presence: true,
                       content_type: { content_type: ['audio/mpeg'] },
                       size: { less_than: 16.megabytes }

  validates_attachment :video_image,
                       content_type: { content_type: ['image/jpeg', 'image/png'] },
                       size: { less_than: 7.megabytes }

  def display_title
    "#{artist} - #{title}"
  end

  private

  def truncate_title
    self.title = self.title.slice(0, 128)
  end

  def truncate_artist
    self.artist = self.artist.slice(0, 128)
  end
end
