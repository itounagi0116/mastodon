class AddVideoSpriteColumnsToTracks < ActiveRecord::Migration[5.1]
  def change
    add_column :tracks, :video_sprite_movement_circle_rad, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_circle_scale, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_circle_speed, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_random_scale, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_random_speed, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_zoom_scale, :float, null: false, default: 0
    add_column :tracks, :video_sprite_movement_zoom_speed, :float, null: false, default: 0
  end
end
