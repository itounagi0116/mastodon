class AddVideoBannerAlphaToTracks < ActiveRecord::Migration[5.1]
  def change
    add_column :tracks, :video_banner_alpha, :float, null: false, default: 0
    change_column_default :tracks, :video_banner_alpha, 1
  end
end
