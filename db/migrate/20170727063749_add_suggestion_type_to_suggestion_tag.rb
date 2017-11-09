class AddSuggestionTypeToSuggestionTag < ActiveRecord::Migration[5.1]
  def change
    add_column :suggestion_tags, :suggestion_type, :integer, null: false, default: 0
  end
end
