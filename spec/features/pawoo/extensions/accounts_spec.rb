# frozen_string_literal: true

require 'rails_helper'

describe 'Pawoo extensions of account page', type: :feature do
  # need to autoload because of the way RSpec stubs constants
  # https://github.com/rspec/rspec-mocks/pull/201
  AccountsController

  describe 'individual account page' do
    let(:account) { Fabricate(:account, domain: nil, username: 'username') }

    context 'with media requested' do
      it 'shows the link for the next media page' do
        stub_const 'AccountsController::PAGE_SIZE', 1
        statuses = Fabricate.times(2, :status, account: account)
        statuses.each { |status| Fabricate(:media_attachment, account: account, status: status, file: nil) }

        visit '/@username/media?page=1'

        expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username/media?page=2'
      end

      it 'shows the link for the previous media page' do
        stub_const 'AccountsController::PAGE_SIZE', 1
        statuses = Fabricate.times(2, :status, account: account)
        statuses.each { |status| Fabricate(:media_attachment, account: account, status: status, file: nil) }

        visit '/@username/media?page=2'

        expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username/media'
      end
    end

    context 'with replies requested' do
      it 'shows the link for the next reply page' do
        stub_const 'AccountsController::PAGE_SIZE', 1
        Fabricate.times(2, :status, account: account)

        visit '/@username/with_replies?page=1'

        expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username/with_replies?page=2'
      end

      it 'shows the link for the previous reply page' do
        stub_const 'AccountsController::PAGE_SIZE', 1
        Fabricate.times(2, :status, account: account)

        visit '/@username/with_replies?page=2'

        expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username/with_replies'
      end
    end

    it 'shows the specified page' do
      stub_const 'AccountsController::PAGE_SIZE', 1
      Fabricate(:status, account: account, created_at: 2.day.ago, text: 'The text of the older status.')
      Fabricate(:status, account: account, created_at: 1.day.ago, text: 'The text of the newer status.')

      visit '/@username?page=2'

      expect(page).to have_text 'The text of the older status.'
      expect(page).not_to have_text 'The text of the newer status.'
    end

    it 'shows the link for the next page' do
      stub_const 'AccountsController::PAGE_SIZE', 1
      Fabricate.times(2, :status, account: account)

      visit '/@username?page=1'

      expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username?page=2'
    end

    it 'shows the link for the previous page' do
      stub_const 'AccountsController::PAGE_SIZE', 1
      Fabricate.times(3, :status, account: account)

      visit '/@username?page=3'

      expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username?page=2'
    end

    it 'shows the link for the initial page if it is the second page' do
      stub_const 'AccountsController::PAGE_SIZE', 1
      Fabricate.times(2, :status, account: account)

      visit '/@username?page=2'

      expect(page).to have_link href: 'https://cb6e6126.ngrok.io/@username'
    end
  end
end
