# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::Statuses::ReactionsController do
  render_views

  let(:user)  { Fabricate(:user, account: Fabricate(:account, username: 'alice')) }
  let(:token) { Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write') }

  context 'with an oauth token' do
    before do
     DatabaseCleaner.clean
     DatabaseCleaner.strategy = :truncation
     DatabaseCleaner.clean_with :truncation
     DatabaseCleaner.start

     allow(controller).to receive(:doorkeeper_token) { token }
    end

    describe 'POST #create' do
      let(:status) { Fabricate(:status, account: user.account, music: Fabricate(:album)) }

      before do
        post :create, params: { status_id: status, text: '😺' }
      end

      it 'returns http success' do
        expect(response).to have_http_status :success
      end

      it 'updates accounts attribute' do
        expect(status.reactions.find_by!(text: '😺').accounts).to include user.account
      end

      it 'return json with updated attributes' do
        expect(body_as_json[:id]).to eq status.id
        expect(body_as_json[:reactions]).to include({ accounts_count: 1, text: '😺', reacted: true })
      end
    end

    describe 'POST #destroy' do
      let(:status) { Fabricate(:status, account: user.account, music: Fabricate(:album)) }
      let!(:reaction) { Fabricate(:reaction, accounts: [user.account], status: status, text: '😺') }

      before do
        post :destroy, params: { status_id: status, text: '😺' }
      end

      it 'returns http success' do
        expect(response).to have_http_status :success
      end

      it 'destroys reaction' do
        expect{ reaction.reload }.to raise_error ActiveRecord::RecordNotFound
      end

      it 'return json with updated attributes' do
        expect(body_as_json[:id]).to eq status.id
        expect(body_as_json[:reactions]).not_to include({ accounts_count: 1, text: '😺', reacted: true })
      end
    end
  end

  context 'without an oauth token' do
    describe 'POST #create' do
      let(:status) { Fabricate(:status, account: user.account, music: Fabricate(:album)) }

      before do
        post :create, params: { status_id: status, text: '😺' }
      end

      it 'returns http unauthorized' do
        expect(response).to have_http_status :unauthorized
      end
    end
  end
end
