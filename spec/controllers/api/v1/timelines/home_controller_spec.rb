# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::Timelines::HomeController do
  render_views

  let(:user)  { Fabricate(:user, account: Fabricate(:account, username: 'alice'), current_sign_in_at: 1.day.ago) }

  before do
    allow(controller).to receive(:doorkeeper_token) { token }
  end

  context 'with a user context' do
    let(:token) { Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'read') }

    describe 'GET #show' do
      context 'when max id is given' do
        it 'limits since id with max id' do
          Fabricate(:status, account: user.account, text: 'out of range', id: 1)
          Fabricate(:status, account: user.account, text: 'last', id: 2)
          Redis.current.set("account:#{user.account.id}:regeneration", 1)

          get :show, params: { max_id: FeedManager::MIN_ID_RANGE + 1 }

          expect(response.body).to include 'last'
          expect(response.body).not_to include 'out of range'
        end
      end

      context 'when max id is not given' do
        it 'limits since id with the id of the latest status' do
          Fabricate(:status, account: user.account, text: 'out of range', id: 1)
          Fabricate(:status, account: user.account, text: 'last', id: 2)
          Fabricate(:status, account: user.account, text: 'first', id: FeedManager::MIN_ID_RANGE + 1)
          Redis.current.set("account:#{user.account.id}:regeneration", 1)

          get :show

          expect(response.body).to include 'last'
          expect(response.body).not_to include 'out of range'
        end

        it 'returns http success even if there is no status' do
          get :show
          expect(response).to have_http_status(:success)
        end
      end

      context 'when since id is given' do
        it 'limits since id' do
          Fabricate(:status, account: user.account, text: 'out of range', id: 2)
          Fabricate(:status, account: user.account, text: 'last', id: 3)
          Redis.current.set("account:#{user.account.id}:regeneration", 1)

          get :show, params: { max_id: FeedManager::MIN_ID_RANGE + 2, since_id: 1 }

          expect(response.body).to include 'last'
          expect(response.body).not_to include 'out of range'
        end
      end

      context 'when since id is not given' do
        it 'limits since id' do
          Fabricate(:status, account: user.account, text: 'out of range', id: 1)
          Fabricate(:status, account: user.account, text: 'last', id: 2)
          Redis.current.set("account:#{user.account.id}:regeneration", 1)

          get :show, params: { max_id: FeedManager::MIN_ID_RANGE + 1 }

          expect(response.body).to include 'last'
          expect(response.body).not_to include 'out of range'
        end
      end

      it 'returns http success' do
        follow = Fabricate(:follow, account: user.account)
        PostStatusService.new.call(follow.target_account, 'New status for user home timeline.')

        get :show

        expect(response).to have_http_status(:success)
        expect(response.headers['Link'].links.size).to eq(2)
      end
    end
  end

  context 'without a user context' do
    let(:token) { Fabricate(:accessible_access_token, resource_owner_id: nil, scopes: 'read') }

    describe 'GET #show' do
      it 'returns http unprocessable entity' do
        get :show

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.headers['Link']).to be_nil
      end
    end
  end
end
