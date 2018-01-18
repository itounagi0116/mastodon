class AddCounterForTracksAndAlbumsToAlbumTrack < ActiveRecord::Migration[5.1]
  def change
    add_column :albums, :tracks_count, :integer, null: false, default: 0
    add_column :tracks, :albums_count, :integer, null: false, default: 0
  end
end
