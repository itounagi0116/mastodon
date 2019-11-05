# frozen_string_literal: true

class PawooRemovePawooExpoPushTokens < ActiveRecord::Migration[5.2]
  disable_ddl_transaction!

  def up
    drop_table :pawoo_expo_push_tokens
  end

  def down
  end
end
