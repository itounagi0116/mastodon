class AddReactionTables < ActiveRecord::Migration[5.1]
  def change
    create_table :reactions do |t|
      t.belongs_to :status, foreign_key: { on_delete: :cascade, on_update: :cascade }, null: false
      t.string :text, null: false
      t.integer :accounts_count, null: false, default: 0

      t.index [:status_id, :text], unique: true
    end

    create_table :accounts_reactions, id: false do |t|
      t.belongs_to :reaction, foreign_key: { on_delete: :cascade, on_update: :cascade }, null: false
      t.belongs_to :account, foreign_key: { on_delete: :restrict, on_update: :cascade }, null: false
      t.index [:reaction_id, :account_id], unique: true
    end
  end
end
