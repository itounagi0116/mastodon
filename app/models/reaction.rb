# frozen_string_literal: true
# == Schema Information
#
# Table name: reactions
#
#  id             :integer          not null, primary key
#  status_id      :integer          not null
#  text           :string           not null
#  accounts_count :integer          default(0), not null
#


class Reaction < ApplicationRecord
  PERMITTED_TEXTS = %w(👍 ♥ 😺 🤔)

  belongs_to :status, inverse_of: :reactions
  has_and_belongs_to_many :accounts
  validates :text, inclusion: { in: PERMITTED_TEXTS }

  def self.push_account(account, attributes)
    ApplicationRecord.transaction do
      reaction = find_by(attributes)

      if reaction.nil?
        reaction = Reaction.create!(attributes.merge(accounts_count: 1))
      else
        reaction.increment! :accounts_count
      end

      reaction.accounts << account
    end
  end

  def self.destroy_account(account, attributes)
    ApplicationRecord.transaction isolation: :repeatable_read do
      reaction = find_by!(attributes)

      if reaction.accounts_count <= 1
        reaction.destroy!
      else
        reaction.accounts.destroy account
        reaction.decrement! :accounts_count
      end
    end
  end

  def self.destroy_account_all(account)
    scope = account.reactions

    while !scope.nil?
      scope = ApplicationRecord.transaction isolation: :repeatable_read do
        reaction = scope.order(:id).first

        next if reaction.nil?

        if reaction.accounts_count <= 1
          reaction.destroy!
        else
          reaction.accounts.destroy account
          reaction.decrement! :accounts_count
        end

        account.reactions.where('id > ?', reaction)
      end
    end
  end
end
