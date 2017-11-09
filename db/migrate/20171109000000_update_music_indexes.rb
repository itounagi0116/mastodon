class UpdateMusicIndexes < ActiveRecord::Migration[5.1]
  disable_ddl_transaction!

  def change
    add_index :statuses, [:account_id, :music_type, :id], algorithm: :concurrently
    remove_index :statuses, column: [:music_type, :account_id], algorithm: :concurrently
    remove_index :statuses, column: [:music_type, :id], algorithm: :concurrently
    remove_index :statuses, column: [:reblog_of_id, :music_type, :music_id], algorithm: :concurrently
    remove_index :album_tracks, :album_id
  end
end
