class RemovePinnedStatus < ActiveRecord::Migration[5.1]
  def change
    drop_table :pinned_statuses
  end
end
