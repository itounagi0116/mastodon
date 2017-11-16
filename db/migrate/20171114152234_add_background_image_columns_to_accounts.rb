class AddBackgroundImageColumnsToAccounts < ActiveRecord::Migration[5.1]
  def up
    add_attachment :accounts, :background_image
  end

  def down
    remove_attachment :users, :background_image
  end
end
