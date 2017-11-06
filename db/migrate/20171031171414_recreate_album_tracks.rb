class RecreateAlbumTracks < ActiveRecord::Migration[5.1]
  def change
    drop_table :album_tracks
    create_table :album_tracks do |t|
      t.belongs_to :album, foreign_key: { on_delete: :cascade, on_update: :cascade }, null: false
      t.belongs_to :track, foreign_key: { on_delete: :cascade, on_update: :cascade }, null: false
      t.decimal :position, null: false

      t.index [:album_id, :track_id], unique: true
      t.index [:album_id, :position], unique: true
    end
  end
end
