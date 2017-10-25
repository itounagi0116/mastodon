class AddVideo1920x1080ToTracks < ActiveRecord::Migration[5.1]
  def change
    add_attachment :tracks, :video_1920x1080
  end
end
