class CreateAccountCustomColors < ActiveRecord::Migration[5.1]
  def change
    create_table :account_custom_colors do |t|
      t.belongs_to :account, foreign_key: { on_delete: :cascade }, null: false
      t.integer :textcolor, null: false, default: 0x313131
      t.integer :linkcolor, null: false, default: 0x9B9B9B
      t.integer :linkcolor2, null: false, default: 0x2495DB
      t.integer :strong1, null: false, default: 0xD0021B
      t.integer :strong2, null: false, default: 0x000000
      t.integer :color1, null: false, default: 0xffffff
      t.integer :color2, null: false, default: 0xF3F3F3
      t.integer :color3, null: false, default: 0xd0d0d0
    end

    remove_index :account_custom_colors, :account_id
    add_index :account_custom_colors, :account_id, unique: true
  end
end
