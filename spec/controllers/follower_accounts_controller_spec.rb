require 'rails_helper'

describe FollowerAccountsController do
  render_views

  let(:alice) { Fabricate(:account, username: 'alice') }
  let(:follower0) { Fabricate(:account) }
  let(:follower1) { Fabricate(:account) }

  describe 'GET #index' do
    it 'returns http success' do
      get :index, params: { account_username: alice.acct }
      expect(response).to have_http_status(:success)
    end

    context 'account is remote' do
      let(:alice) { Fabricate(:account, username: 'alice', domain: 'example.com') }

      it 'returns http success' do
        get :index, params: { account_username: alice.acct }
        expect(response).to have_http_status(:success)
      end
    end

    context 'activitystreams2' do
      before do
        get :index, params: { account_username: alice.acct }, format: 'json'
      end

      it 'assigns @account' do
        expect(assigns(:account)).to eq alice
      end

      it 'returns http success with Activity Streams 2.0' do
        expect(response).to have_http_status(:success)
      end

      it 'returns application/activity+json' do
        expect(response.content_type).to eq 'application/activity+json'
      end

      context 'account is remote' do
        let(:alice) { Fabricate(:account, username: 'alice', domain: 'example.com') }

        it 'returns http not_found' do
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end
end
