class AddVideoBackgroundcolorToTracks < ActiveRecord::Migration[5.1]
  def change
    add_column :tracks, :video_backgroundcolor, :integer, null: false, default: 0x171717
  end
end
