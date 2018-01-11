require 'rails_helper'

describe Api::V1::Accounts::PinnedStatusesController do
  render_views

  let(:user)  { Fabricate(:user, account: Fabricate(:account, username: 'alice')) }
  let(:token) { double acceptable?: true, resource_owner_id: user.id }
  let!(:status) { Fabricate(:status, account: user.account) }
  let!(:track_status) { Fabricate(:status, account: user.account, music: Fabricate(:track)) }
  let!(:album_status) { Fabricate(:status, account: user.account, music: Fabricate(:album)) }

  before do
    allow(controller).to receive(:doorkeeper_token) { token }
  end

  describe 'GET #index' do
    let!(:status_pin) { Fabricate(:status_pin, account: user.account, status: status) }
    let!(:status_pin_track) { Fabricate(:status_pin, account: user.account, status: track_status) }
    let!(:status_pin_album) { Fabricate(:status_pin, account: user.account, status: album_status) }

    it 'returns http success' do
      get :index, params: { account_id: user.account.id, limit: 1 }
      expect(response).to have_http_status(:success)
      expect(response.headers['Link'].links.size).to eq(2)
    end

    it 'return all pinned statuses' do
      get :index, params: { account_id: user.account.id }
      expect(body_as_json.size).to eq 3
    end

    context 'with only_musics' do
      it 'return only music statuses' do
        get :index, params: { account_id: user.account.id, only_musics: true }

        expect(body_as_json.size).to eq 2
        expect(body_as_json[0][:album]).to be_truthy
        expect(body_as_json[1][:track]).to be_truthy
      end
    end

    context 'with only_tracks' do
      it 'return only track statuses' do
        get :index, params: { account_id: user.account.id, only_tracks: true }

        expect(body_as_json.size).to eq 1
        expect(body_as_json[0][:track]).to be_truthy
      end
    end

    context 'with only_albums' do
      it 'return only album statuses' do
        get :index, params: { account_id: user.account.id, only_albums: true }

        expect(body_as_json.size).to eq 1
        expect(body_as_json[0][:album]).to be_truthy
      end
    end
  end
end
