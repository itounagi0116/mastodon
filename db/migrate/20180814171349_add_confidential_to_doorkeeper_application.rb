class AddConfidentialToDoorkeeperApplication < ActiveRecord::Migration[5.1]

  def up
    add_column(
      :oauth_applications,
      :confidential,
      :boolean,
      null: false,
      default: true # maintaining backwards compatibility: require secrets
    )
  end

  def down
    remove_column :oauth_applications, :confidential
  end
end
