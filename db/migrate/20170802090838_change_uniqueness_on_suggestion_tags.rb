class ChangeUniquenessOnSuggestionTags < ActiveRecord::Migration[5.1]
  def change
    change_table :suggestion_tags do |t|
      t.remove_index(:tag_id)
      t.index [:tag_id, :suggestion_type], unique: true
    end
  end
end
