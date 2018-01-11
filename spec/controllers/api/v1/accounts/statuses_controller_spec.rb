require 'rails_helper'

describe Api::V1::Accounts::StatusesController do
  render_views

  let(:user)  { Fabricate(:user, account: Fabricate(:account, username: 'alice')) }
  let(:token) { Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'read') }

  before do
    allow(controller).to receive(:doorkeeper_token) { token }
    Fabricate(:status, account: user.account)
  end

  describe 'GET #index' do
    it 'returns http success' do
      get :index, params: { account_id: user.account.id, limit: 1 }

      expect(response).to have_http_status(:success)
      expect(response.headers['Link'].links.size).to eq(2)
    end

    context 'with only media' do
      it 'returns http success' do
        get :index, params: { account_id: user.account.id, only_media: true }

        expect(response).to have_http_status(:success)
      end
    end

    context 'with exclude replies' do
      before do
        Fabricate(:status, account: user.account, thread: Fabricate(:status))
      end

      it 'returns http success' do
        get :index, params: { account_id: user.account.id, exclude_replies: true }

        expect(response).to have_http_status(:success)
      end
    end

    context 'with only pinned' do
      before do
        Fabricate(:status_pin, account: user.account, status: Fabricate(:status, account: user.account))
      end

      it 'returns http success' do
        get :index, params: { account_id: user.account.id, pinned: true }

        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'GET #index with only musics' do
    it 'returns http success' do
      get :index, params: { account_id: user.account.id, only_musics: true }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET #index with only tracks' do
    it 'returns http success' do
      get :index, params: { account_id: user.account.id, only_tracks: true }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET #index with only albums' do
    it 'returns http success' do
      get :index, params: { account_id: user.account.id, only_albums: true }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET #index with excluded album' do
    context 'without only tracks' do
      it 'returns http unprocessable entity' do
        status = Fabricate(:status, music: Fabricate(:album))
        get :index, params: { account_id: status.account_id, excluded_album: status }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'with invisible album' do
      it 'returns http forbidden' do
        account = Fabricate(:account)
        status = Fabricate(:status, music: Fabricate(:album), visibility: :direct)

        get :index, params: { account_id: account.id, excluded_album: status, only_tracks: true }

        expect(response).to have_http_status(:forbidden)
      end
    end

    it 'returns statuses not included in the specified album' do
      account = Fabricate(:account)
      album = Fabricate(:album)
      album_status = Fabricate(:status, music: album)
      tracks = 2.times.map { Fabricate(:track) }
      track_statuses = tracks.map { |track| Fabricate(:status, account: account, music: track) }
      AlbumTrack.create!(album: album, track: tracks[0], position: 0.5)

      get :index, params: { account_id: account.id, excluded_album: album_status, only_tracks: true }

      expect(body_as_json.pluck(:id)).not_to include track_statuses[0].id
    end
  end
end
