# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::Albums::TracksController, type: :controller do
  let(:user) { Fabricate(:user) }
  let(:album) { Fabricate(:album) }
  let(:track) { Fabricate(:track) }

  describe 'PUT #update' do
    context 'with write scope' do
      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end
      end

      context 'with origin status of album and track authored by self' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: nil) }

        context 'when parameter relative_to is present' do
          let(:relative_to) { Fabricate(:album_track, album: album, position: '0.2') }
          let(:relative_to_status) { Fabricate(:status, music: relative_to.track) }

          context 'when above parameter is false' do
            subject { put :update, params: { album_id: album_status, id: track_status, relative_to: relative_to_status } }

            it 'sets the position below relative_to and above the succeeding track if present' do
              Fabricate(:album_track, album: album, position: '0.3')

              subject

              subject_model = AlbumTrack.find_by!(album: album, track: track)
              expect(subject_model.position).to be_between(BigDecimal('0.2'), BigDecimal('0.3')).exclusive
            end

            it 'sets the position below relative_to and above the maximum if there is no suceeding track' do
              subject

              subject_model = AlbumTrack.find_by!(album: album, track: track)
              expect(subject_model.position).to be_between(BigDecimal('0.2'), AlbumTrack::MAX_POSITION).exclusive
            end
          end

          context 'when above parameter is true' do
            subject { put :update, params: { album_id: album_status, id: track_status, relative_to: relative_to_status, above: true } }

            it 'sets the position above relative_to and below the proceeding track if present' do
              Fabricate(:album_track, album: album, position: '0.1')

              subject

              subject_model = AlbumTrack.find_by!(album: album, track: track)
              expect(subject_model.position).to be_between(BigDecimal('0.1'), BigDecimal('0.2')).exclusive
            end

            it 'sets the position above relative_to and below the minimum if there is no proceeding track' do
              subject

              subject_model = AlbumTrack.find_by!(album: album, track: track)
              expect(subject_model.position).to be_between(AlbumTrack::MIN_POSITION, BigDecimal('0.2')).exclusive
            end
          end

          it 'updates the specified record if present'
        end

        context 'when parameter relative_to is not present' do
          it 'sets the position below the last track if present and above parameter is false' do
            Fabricate(:album_track, album: album, position: '0.5')

            put :update, params: { album_id: album_status, id: track_status }

            subject_model = AlbumTrack.find_by!(album: album, track: track)
            expect(subject_model.position).to be_between(BigDecimal('0.5'), AlbumTrack::MAX_POSITION).exclusive
          end

          it 'sets the position below the last track if present and above parameter is true' do
            Fabricate(:album_track, album: album, position: '0.5')

            put :update, params: { album_id: album_status, id: track_status, above: true }

            subject_model = AlbumTrack.find_by!(album: album, track: track)
            expect(subject_model.position).to be_between( AlbumTrack::MIN_POSITION, BigDecimal('0.5')).exclusive
          end

          it 'sets the middle position if there is no track' do
            put :update, params: { album_id: album_status, id: track_status }

            subject_model = AlbumTrack.find_by!(album: album, track: track)
            expect(subject_model.position).to be_between(AlbumTrack::MIN_POSITION, AlbumTrack::MAX_POSITION).exclusive
          end
        end

        it 'returns http success' do
          put :update, params: { album_id: album_status, id: track_status }
          expect(response).to have_http_status :success
        end
      end

      context 'with reblog of album' do
        let(:album_reblog) { Fabricate(:status, music: album) }
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: album_reblog) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: nil) }

        it 'returns http not_found' do
          put :update, params: { album_id: album_status, id: track_status }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with reblog of track' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }
        let(:track_reblog) { Fabricate(:status, music: track) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: track_reblog) }

        it 'returns http not_found' do
          put :update, params: { album_id: album_status, id: track_status }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with album status authored by another' do
        let(:album_status) { Fabricate(:status, music: album) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track) }

        it 'returns http unprocessable_entity' do
          put :update, params: { album_id: album_status, id: track_status }
          expect(response).to have_http_status :unprocessable_entity
        end
      end

      context 'with track status authored by another' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album) }
        let(:track_status) { Fabricate(:status, music: track) }

        it 'returns http unprocessable_entity' do
          put :update, params: { album_id: album_status, id: track_status }
          expect(response).to have_http_status :unprocessable_entity
        end
      end
    end

    context 'without write scope' do
      let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }
      let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: nil) }

      it 'returns http unauthorized' do
        put :update, params: { album_id: album_status, id: track_status }
        expect(response).to have_http_status :unauthorized
      end
    end
  end

  describe 'PATCH #update' do
    let(:origin) { Fabricate(:album_track, album: album, position: '0.4') }
    let(:origin_status) { Fabricate(:status, music: origin.track) }

    context 'with write scope' do
      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end
      end

      context 'with origin status of album and track authored by self' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: nil) }

        let!(:album_track) do
          Fabricate(:album_track, album: album, track: track, position: '0.3')
        end

        xit 'updates album tracks' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }

          album_track.reload
          expect(album_track.position).to be > BigDecimal('0.4')
        end

        xit 'returns http success' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }
          expect(response).to have_http_status :success
        end
      end

      context 'with reblog of album' do
        let(:album_reblog) { Fabricate(:status, music: album) }
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: album_reblog) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: nil) }

        it 'returns http not_found' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with reblog of track' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album, reblog: nil) }
        let(:track_reblog) { Fabricate(:status, music: track) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track, reblog: track_reblog) }

        it 'returns http not_found' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with album status authored by another' do
        let(:album_status) { Fabricate(:status, music: album) }
        let(:track_status) { Fabricate(:status, account: user.account, music: track) }

        it 'returns http unprocessable_entity' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }
          expect(response).to have_http_status :unprocessable_entity
        end
      end

      context 'with track status authored by another' do
        let(:album_status) { Fabricate(:status, account: user.account, music: album) }
        let(:track_status) { Fabricate(:status, music: track) }

        it 'returns http unprocessable_entity' do
          patch :update, params: { album_id: album_status, id: track_status, prev_id: origin_status }
          expect(response).to have_http_status :unprocessable_entity
        end
      end
    end

    context 'without write scope' do
      let(:album_status) { Fabricate(:status, music: album, reblog: nil) }
      let(:track_status) { Fabricate(:status, account: album_status.account, music: track, reblog: nil) }

      it 'returns http unauthorized' do
        patch :update, params: { album_id: album_status, id: track.id, prev_id: origin.track_id }
        expect(response).to have_http_status :unauthorized
      end
    end
  end

  describe 'GET #index' do
    let(:album_status) { Fabricate(:status, music: album, reblog: nil) }
    let(:track_status) { Fabricate(:status, account: album_status.account, music: track, reblog: nil) }

    render_views

    it 'renders tracks ordered by position column with id constraints' do
      statuses = ['0.3', '0.2', '0.1'].map do |position|
        album_track = Fabricate(:album_track, album: album, position: position)
        Fabricate(:status, music: album_track.track)
      end

      get :index, params: { album_id: album_status, since_id: statuses[2].music, max_id: statuses[0].music }

      expect(body_as_json.pluck(:id)).to match_array [statuses[1].id]
    end

    it 'renders tracks ordered by position column with limit constraint' do
      statuses = ['0.2', '0.1'].map do |position|
        album_track = Fabricate(:album_track, album: album, position: position)
        Fabricate(:status, music: album_track.track)
      end

      get :index, params: { album_id: album_status, limit: 1 }

      expect(body_as_json.pluck(:id)).to match_array [statuses[1].id]
    end

    it 'set pagination headers if necessary' do
      statuses = ['0.3', '0.2', '0.1'].map do |position|
        album_track = Fabricate(:album_track, album: album, position: position)
        Fabricate(:status, music: album_track.track)
      end

      get :index, params: { album_id: album_status, since_id: statuses[2].music, limit: 1 }

      expect(response.headers['Link'].find_link(['rel', 'next']).href).to eq api_v1_album_tracks_url(limit: 1, since_id: statuses[1])
      expect(response.headers['Link'].find_link(['rel', 'prev']).href).to eq api_v1_album_tracks_url(limit: 1, max_id: statuses[1])
    end

    it 'returns http unprocessable_entity if ranging parameters are unprocessable' do
      get :index, params: { album_id: album_status, since_id: 1, max_id: 2 }
      expect(response).to have_http_status :unprocessable_entity
    end

    it 'returns http success' do
      get :index, params: { album_id: album_status }
      expect(response).to have_http_status :success
    end
  end

  describe 'DELETE #destroy'
end
