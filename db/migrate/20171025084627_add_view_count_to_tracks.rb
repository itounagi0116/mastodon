class AddViewCountToTracks < ActiveRecord::Migration[5.1]
  def change
    add_column :tracks, :view_count, :integer, null: false, default: 0
  end
end
