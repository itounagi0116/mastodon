class AddIndexStatusIdOnStatusPin < ActiveRecord::Migration[5.1]
  def change
    add_index :status_pins, :status_id
  end
end
