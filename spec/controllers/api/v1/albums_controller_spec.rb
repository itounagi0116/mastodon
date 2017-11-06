# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::AlbumsController, type: :controller do
  render_views

  let(:image) { fixture_file_upload('files/attachment.jpg') }

  describe 'POST #create' do
    context 'with write scope' do
      let(:user) { Fabricate(:user) }

      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end

        stub_request(:head, %r{^http://test\.host/.*}).to_return status: 400
      end

      it 'creates and renders albums and status' do
        post :create,
             params: { title: 'title', text: 'text', image: image }

        status = Status.find_by!(
          id: body_as_json[:id],
          account: user.account,
          music_type: 'Album'
        )

        expect(status.music.title).to eq 'title'
        expect(status.music.text).to eq 'text'
        expect(body_as_json[:album][:title]).to eq 'title'
        expect(body_as_json[:album][:text]).to eq 'text'
      end

      it 'creates and renders with tracks' do
        account = Fabricate(:account, user: user)
        track1 = Fabricate(:track, title: 'title1', artist: 'artist1')
        track_status1 = Fabricate(:status, account: account, music: track1)
        track2 = Fabricate(:track, title: 'title2', artist: 'artist2')
        track_status2 = Fabricate(:status, account: account, music: track2)

        post :create,
             params: { title: 'title', text: 'text', image: image, track_ids: [track_status1.id, track_status2.id] }

        status = Status.find_by!(
          id: body_as_json[:id],
          account: user.account,
          music_type: 'Album'
        )

        expect(status.music.tracks.first.title).to eq 'title1'
        expect(status.music.tracks.first.artist).to eq 'artist1'
        expect(status.music.tracks.second.title).to eq 'title2'
        expect(status.music.tracks.second.artist).to eq 'artist2'
        expect(body_as_json[:album][:tracks_count]).to eq 2
      end

      it 'joins given text and URL to create status text'
      it 'uses URL as status text if the given text is blank'

      it 'returns http success' do
        post :create, params: { title: 'title', text: 'text', image: image }

        expect(response).to have_http_status :success
      end
    end

    context 'without write scope' do
      it 'returns http unauthorized' do
        post :create, params: { title: 'title', text: 'text', image: image }

        expect(response).to have_http_status :unauthorized
      end
    end
  end

  describe 'PATCH #update' do
    context 'with write scope' do
      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end
      end

      let(:user) { Fabricate(:user) }
      let(:album) { Fabricate(:album) }

      context 'with origin status authored by self' do
        let(:status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }

        it 'updates and renders albums' do
          patch :update,
                params: { id: status.id, title: 'updated title', text: 'updated text' }

          album.reload
          expect(album.title).to eq 'updated title'
          expect(album.text).to eq 'updated text'
          expect(body_as_json[:id]).to eq status.id
          expect(body_as_json[:album][:title]).to eq 'updated title'
          expect(body_as_json[:album][:text]).to eq 'updated text'
        end

        it 'returns http success' do
          patch :update, params: { id: status.id }
          expect(response).to have_http_status :success
        end
      end

      context 'with status authored by another' do
        let(:status) { Fabricate(:status, music: album, reblog: nil) }

        it 'returns http not found' do
          patch :update, params: { id: status.id }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with reblog' do
        let(:reblog) { Fabricate(:status, music: album) }
        let(:status) { Fabricate(:status, account: user.account, music: album, reblog: reblog) }

        it 'returns http not found' do
          patch :update, params: { id: status.id }
          expect(response).to have_http_status :not_found
        end
      end
    end

    context 'without write scope' do
      it 'returns http unauthorized' do
        album = Fabricate(:album)
        patch :update, params: { id: album.id }
        expect(response).to have_http_status :unauthorized
      end
    end
  end
end
