class UpdateMusicIndexes < ActiveRecord::Migration[5.1]
  def change
    add_index :statuses, [:account_id, :music_type, :id]
    remove_index :statuses, [:music_type, :account_id]
    remove_index :statuses, [:music_type, :id]
    remove_index :statuses, [:reblog_of_id, :music_type, :music_id]
    remove_index :album_tracks, :album_id
  end
end
