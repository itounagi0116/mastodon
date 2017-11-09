class AddStatusesIndexOnReblogOfIdMusicTypeIdAgain < ActiveRecord::Migration[5.1]
  def change
    add_index :statuses, [:reblog_of_id, :music_type, :id]
  end
end
