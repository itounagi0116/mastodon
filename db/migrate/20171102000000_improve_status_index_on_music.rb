class ImproveStatusIndexOnMusic < ActiveRecord::Migration[5.1]
  def change
    add_index :statuses, [:account_id, :id], where: 'music_type IS NOT NULL'
    add_index :statuses, [:music_type, :id], name: 'index_statuses_on_music_type_and_id_where_reblog_of_id_is_null', where: 'reblog_of_id IS NULL'
    add_index :statuses, :id, where: 'reblog_of_id IS NULL AND music_type IS NOT NULL'
    add_index :statuses, :reblog_of_id

    remove_index :statuses, [:music_type, :account_id]
    remove_index :statuses, [:reblog_of_id, :music_type, :music_id]
  end
end
