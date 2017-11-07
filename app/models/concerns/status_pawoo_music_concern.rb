# frozen_string_literal: true

module StatusPawooMusicConcern
  extend ActiveSupport::Concern

  included do
    after_destroy { self.music&.destroy! unless self.reblog? }
    belongs_to :music, polymorphic: true
    scope :musics_only, -> { where(music_type: 'Track') } # TODO: include Album
    scope :tracks_only, -> { where(music_type: 'Track') }
    scope :albums_only, -> { where(music_type: 'Album') }
    counter_culture :account, column_name: -> (model) { (!model.reblog? && !model.music_type.nil?) ? "#{model.music_type.downcase.pluralize}_count" : nil }
  end

  class_methods do
    def next_id
      ApplicationRecord.connection.select_value "SELECT nextval('statuses_id_seq')"
    end
  end
end
