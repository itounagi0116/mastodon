# frozen_string_literal: true
# == Schema Information
#
# Table name: playlists
#
#  id            :integer          not null, primary key
#  deck          :integer          not null
#  name          :string           default(""), not null
#  deck_type     :integer          default("normal"), not null
#  write_protect :boolean          default(FALSE), not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#

class Playlist < ApplicationRecord
  validates :deck, uniqueness: true, presence: true

  enum deck_type: { normal: 0, apollo: 1 }
end
