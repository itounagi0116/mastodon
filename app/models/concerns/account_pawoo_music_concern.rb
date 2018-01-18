# frozen_string_literal: true

module AccountPawooMusicConcern
  extend ActiveSupport::Concern

  included do
    has_many :music_statuses, -> { where(reblog_of_id: nil).musics_only }, class_name: 'Status'
    has_many :track_statuses, -> { where(reblog_of_id: nil).tracks_only }, class_name: 'Status'
    has_many :album_statuses, -> { where(reblog_of_id: nil).albums_only }, class_name: 'Status'

    has_and_belongs_to_many :reactions
  end
end
