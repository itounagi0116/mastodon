# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::TracksController, type: :controller do
  render_views

  let(:music) { fixture_file_upload('files/high.mp3') }
  let(:another_music) { fixture_file_upload('files/low.mp3') }
  let(:image) { fixture_file_upload('files/attachment.jpg') }
  let(:video) { fixture_file_upload('files/aint_we_got_fun_billy_jones1921.mp4') }
  let(:unknown) { fixture_file_upload('files/imports.txt') }

  describe 'POST #create' do
    context 'with write scope' do
      before do
        stub_request(:head, %r{^http://test\.host/.*}).to_return status: 400
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end
      end

      let(:user) { Fabricate(:user) }

      it 'returns http unprocessable entity when a non-audio file is uploaded as a music' do
        post :create,
             params: { title: 'title', artist: Faker::Name.name, music: unknown }

        expect(response).to have_http_status :unprocessable_entity
      end

      it 'creates and renders status and track' do
        video_params = {
          backgroundcolor: 0xffffff,
          sprite: {
            movement: {
              circle: { rad: 1, scale: 1, speed: 1 },
              random: { scale: 1, speed: 1 },
              zoom: { scale: 1, speed: 1 },
            },
          },
          blur: {
            visible: true,
            movement: { band: { bottom: 50, top: 300 }, threshold: 165 },
            blink: { band: { bottom: 2000, top: 15000 }, threshold: 165 },
          },
          particle: {
            visible: true,
            limit: { band: { bottom: 300, top: 2000 }, threshold: 165 },
            alpha: 1,
            color: 0xff0000,
          },
          lightleaks: {
            visible: true,
            alpha: 1,
            interval: 1,
          },
          spectrum: {
            visible: true,
            mode: 0,
            alpha: 1,
            color: 0xff0000,
          },
          text: {
            visible: true,
            alpha: 1,
            color: 0xffffff,
          },
          banner: {
            visible: true,
            alpha: 0.5,
          },
        }

        post :create,
             params: { title: 'title', artist: 'artist', text: 'text', visibility: 'public', music: music, video: video_params }

        status = Status.find_by!(
          id: body_as_json[:id],
          account: user.account,
          music_type: 'Track'
        )

        expect(status.visibility).to eq 'public'
        expect(status.music.title).to eq 'title'
        expect(status.music.artist).to eq 'artist'
        expect(status.music.text).to eq 'text'
        expect(status.music.duration).to eq 2
        expect(status.music.video_backgroundcolor).to eq 0xffffff
        expect(status.music.video_sprite_movement_circle_rad).to eq 1
        expect(status.music.video_sprite_movement_circle_scale).to eq 1
        expect(status.music.video_sprite_movement_circle_speed).to eq 1
        expect(status.music.video_sprite_movement_random_scale).to eq 1
        expect(status.music.video_sprite_movement_random_speed).to eq 1
        expect(status.music.video_sprite_movement_zoom_scale).to eq 1
        expect(status.music.video_sprite_movement_zoom_speed).to eq 1
        expect(status.music.video_blur_movement_band_bottom).to eq 50
        expect(status.music.video_blur_movement_band_top).to eq 300
        expect(status.music.video_blur_movement_threshold).to eq 165
        expect(status.music.video_blur_blink_band_bottom).to eq 2000
        expect(status.music.video_blur_blink_band_top).to eq 15000
        expect(status.music.video_blur_blink_threshold).to eq 165
        expect(status.music.video_particle_limit_band_bottom).to eq 300
        expect(status.music.video_particle_limit_band_top).to eq 2000
        expect(status.music.video_particle_limit_threshold).to eq 165
        expect(status.music.video_particle_alpha).to eq 1
        expect(status.music.video_particle_color).to eq 0xff0000
        expect(status.music.video_lightleaks_alpha).to eq 1
        expect(status.music.video_spectrum_mode).to eq 0
        expect(status.music.video_spectrum_alpha).to eq 1
        expect(status.music.video_spectrum_color).to eq 0xff0000
        expect(status.music.video_text_alpha).to eq 1
        expect(status.music.video_text_color).to eq 0xffffff
        expect(status.music.video_banner_alpha).to eq 0.5

        expect(body_as_json[:visibility]).to eq 'public'
        expect(body_as_json[:track][:title]).to eq 'title'
        expect(body_as_json[:track][:artist]).to eq 'artist'
        expect(body_as_json[:track][:text]).to eq 'text'
        expect(body_as_json[:track][:video]).to eq video_params
      end

      it 'joins given artist, title, text and URL to create status text' do
        artist = Faker::Name.name
        post :create,
             params: { title: 'title', artist: artist, text: 'text', visibility: 'public', music: music }

        track = Track.find_by!(title: 'title', text: 'text')
        status = track.statuses.find_by!(reblog: nil)
        expect(status.text).to eq ["#{artist} - title", 'text', short_account_status_url(user.account.username, status)].join("\n")
      end

      it 'uses artist, title and URL as status text if the given text is blank' do
        artist = Faker::Name.name
        post :create,
             params: { title: 'title', artist: artist, text: '', visibility: 'public', music: music }

        track = Track.find_by!(title: 'title', text: '')
        status = track.statuses.find_by!(reblog: nil)
        expect(status.text).to eq ["#{artist} - title", short_account_status_url(user.account.username, status)].join("\n")
      end

      it 'returns http success' do
        post :create,
             params: { title: 'title', artist: Faker::Name.name, visibility: 'public', music: music, video: { image: image } }

        expect(response).to have_http_status :success
      end
    end

    context 'without write scope' do
      it 'returns http unauthorized' do
        post :create,
             params: { title: 'title', artist: Faker::Name.name, visibility: 'public', music: music }

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

      it 'updates and renders music attributes' do
        track = Fabricate(:track)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        video_params = {
          backgroundcolor: 0xbac010,
          sprite: {
            movement: {
              circle: { rad: 1, scale: 1, speed: 1 },
              random: { scale: 1, speed: 1 },
              zoom: { scale: 1, speed: 1 },
            },
          },
          blur: {
            visible: true,
            movement: { band: { bottom: 50, top: 300 }, threshold: 165 },
            blink: { band: { bottom: 2000, top: 15000 }, threshold: 165 },
          },
          particle: {
            visible: true,
            limit: { band: { bottom: 300, top: 2000 }, threshold: 165 },
            alpha: 1,
            color: 0xff0000,
          },
          lightleaks: {
            visible: true,
            alpha: 1,
            interval: 1,
          },
          spectrum: {
            visible: true,
            mode: 0,
            alpha: 1,
            color: 0xff0000,
          },
          text: {
            visible: true,
            alpha: 1,
            color: 0xffffff,
          },
          banner: { visible: true, alpha: 0.5 },
        }

        patch :update,
              params: { id: status.id, title: 'updated title', artist: 'updated artist', text: 'updated text', music: another_music, video: video_params }

        track.reload
        expect(track.title).to eq 'updated title'
        expect(track.artist).to eq 'updated artist'
        expect(track.text).to eq 'updated text'
        expect(track.duration).to eq 2
        expect(track.video_sprite_movement_circle_rad).to eq 1
        expect(track.video_sprite_movement_circle_scale).to eq 1
        expect(track.video_sprite_movement_circle_speed).to eq 1
        expect(track.video_sprite_movement_random_scale).to eq 1
        expect(track.video_sprite_movement_random_speed).to eq 1
        expect(track.video_sprite_movement_zoom_scale).to eq 1
        expect(track.video_sprite_movement_zoom_speed).to eq 1
        expect(track.video_blur_movement_band_bottom).to eq 50
        expect(track.video_blur_movement_band_top).to eq 300
        expect(track.video_blur_movement_threshold).to eq 165
        expect(track.video_blur_blink_band_bottom).to eq 2000
        expect(track.video_blur_blink_band_top).to eq 15000
        expect(track.video_blur_blink_threshold).to eq 165
        expect(track.video_particle_limit_band_bottom).to eq 300
        expect(track.video_particle_limit_band_top).to eq 2000
        expect(track.video_particle_limit_threshold).to eq 165
        expect(track.video_particle_alpha).to eq 1
        expect(track.video_particle_color).to eq 0xff0000
        expect(track.video_lightleaks_alpha).to eq 1
        expect(track.video_spectrum_mode).to eq 0
        expect(track.video_spectrum_alpha).to eq 1
        expect(track.video_spectrum_color).to eq 0xff0000
        expect(track.video_text_alpha).to eq 1
        expect(track.video_text_color).to eq 0xffffff
        expect(track.video_banner_alpha).to eq 0.5

        expect(body_as_json[:id]).to eq status.id
        expect(body_as_json[:track][:title]).to eq 'updated title'
        expect(body_as_json[:track][:artist]).to eq 'updated artist'
        expect(body_as_json[:track][:text]).to eq 'updated text'
        expect(body_as_json[:track][:video]).to eq video_params
      end

      it 'returns http unprocessable entity if empty string is given as background color' do
        track = Fabricate(:track)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { backgroundcolor: '' } }

        expect(response).to have_http_status :unprocessable_entity
      end

      it 'does not change video background color and returns http success if nothing is given' do
        track = Fabricate(:track, video_backgroundcolor: 0x171717)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        expect(response).to have_http_status :success
        track.reload
        expect(track.video_backgroundcolor).to eq 0x171717
      end

      it 'unsets video sprite movement circle parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_circle_rad: 1,
          video_sprite_movement_circle_scale: 1,
          video_sprite_movement_circle_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { sprite: { movement: { circle: '' } } } }

        track.reload
        expect(track.video_sprite_movement_circle_rad).to eq 0
        expect(track.video_sprite_movement_circle_scale).to eq 0
        expect(track.video_sprite_movement_circle_speed).to eq 0
      end

      it 'does not change video sprite movement circle parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_circle_rad: 1,
          video_sprite_movement_circle_scale: 1,
          video_sprite_movement_circle_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_sprite_movement_circle_rad).to eq 1
        expect(track.video_sprite_movement_circle_scale).to eq 1
        expect(track.video_sprite_movement_circle_speed).to eq 1
      end

      it 'unsets video sprite movement random parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_random_scale: 1,
          video_sprite_movement_random_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { sprite: { movement: { random: '' } } } }

        track.reload
        expect(track.video_sprite_movement_random_scale).to eq 0
        expect(track.video_sprite_movement_random_speed).to eq 0
      end

      it 'does not change video sprite movement random parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_random_scale: 1,
          video_sprite_movement_random_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_sprite_movement_random_scale).to eq 1
        expect(track.video_sprite_movement_random_speed).to eq 1
      end

      it 'unsets video sprite movement zoom parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_zoom_scale: 1,
          video_sprite_movement_zoom_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { sprite: { movement: { zoom: '' } } } }

        track.reload
        expect(track.video_sprite_movement_zoom_scale).to eq 0
        expect(track.video_sprite_movement_zoom_speed).to eq 0
      end

      it 'does not change video sprite movement zoom parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_sprite_movement_zoom_scale: 1,
          video_sprite_movement_zoom_speed: 1
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_sprite_movement_zoom_scale).to eq 1
        expect(track.video_sprite_movement_zoom_speed).to eq 1
      end

      it 'unsets video blur parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_blur_movement_band_bottom: 50,
          video_blur_movement_band_top: 300,
          video_blur_movement_threshold: 165,
          video_blur_blink_band_bottom: 2000,
          video_blur_blink_band_top: 15000,
          video_blur_blink_threshold: 165
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { blur: '' } }

        track.reload
        expect(track.video_blur_movement_band_bottom).to eq 0
        expect(track.video_blur_movement_band_top).to eq 0
        expect(track.video_blur_movement_threshold).to eq 0
        expect(track.video_blur_blink_band_bottom).to eq 0
        expect(track.video_blur_blink_band_top).to eq 0
        expect(track.video_blur_blink_threshold).to eq 0
      end

      it 'does not change video blur parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_blur_movement_band_bottom: 50,
          video_blur_movement_band_top: 300,
          video_blur_movement_threshold: 165,
          video_blur_blink_band_bottom: 2000,
          video_blur_blink_band_top: 15000,
          video_blur_blink_threshold: 165
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_blur_movement_band_bottom).to eq 50
        expect(track.video_blur_movement_band_top).to eq 300
        expect(track.video_blur_movement_threshold).to eq 165
        expect(track.video_blur_blink_band_bottom).to eq 2000
        expect(track.video_blur_blink_band_top).to eq 15000
        expect(track.video_blur_blink_threshold).to eq 165
      end

      it 'unsets video particle parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_particle_limit_band_bottom: 300,
          video_particle_limit_band_top: 2000,
          video_particle_limit_threshold: 165,
          video_particle_alpha: 1,
          video_particle_color: 0xff0000
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { particle: '' } }

        track.reload
        expect(track.video_particle_limit_band_bottom).to eq 0
        expect(track.video_particle_limit_band_top).to eq 0
        expect(track.video_particle_limit_threshold).to eq 0
        expect(track.video_particle_alpha).to eq 0
        expect(track.video_particle_color).to eq 0
      end

      it 'does not change video particle parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_particle_limit_band_bottom: 300,
          video_particle_limit_band_top: 2000,
          video_particle_limit_threshold: 165,
          video_particle_alpha: 1,
          video_particle_color: 0xff0000
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_particle_limit_band_bottom).to eq 300
        expect(track.video_particle_limit_band_top).to eq 2000
        expect(track.video_particle_limit_threshold).to eq 165
        expect(track.video_particle_alpha).to eq 1
        expect(track.video_particle_color).to eq 0xff0000
      end

      it 'unsets video lightleaks parameters if empty string is given' do
        track = Fabricate(:track, video_lightleaks_alpha: 1)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { lightleaks: '' } }

        track.reload
        expect(track.video_lightleaks_alpha).to eq 0
      end

      it 'does not change video lightleaks parameters if nothing is given' do
        track = Fabricate(:track, video_lightleaks_alpha: 1)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_lightleaks_alpha).to eq 1
      end

      it 'unsets video spectrum parameters if empty string is given' do
        track = Fabricate(
          :track,
          video_spectrum_mode: 0,
          video_spectrum_alpha: 1,
          video_spectrum_color: 0xff0000
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { spectrum: '' } }

        track.reload
        expect(track.video_spectrum_mode).to eq 0
        expect(track.video_spectrum_alpha).to eq 0
        expect(track.video_spectrum_color).to eq 0
      end

      it 'does not change video spectrum parameters if nothing is given' do
        track = Fabricate(
          :track,
          video_spectrum_mode: 0,
          video_spectrum_alpha: 1,
          video_spectrum_color: 0xff0000
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_spectrum_mode).to eq 0
        expect(track.video_spectrum_alpha).to eq 1
        expect(track.video_spectrum_color).to eq 0xff0000
      end

      it 'unsets video text parameter if empty string is given' do
        track = Fabricate(:track,
          video_text_alpha: 1,
          video_text_color: 0xffffff
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status, video: { text: '' } }

        track.reload
        expect(track.video_text_alpha).to eq 0
        expect(track.video_text_color).to eq 0
      end

      it 'does not change video text parameters if nothing is given' do
        track = Fabricate(:track,
          video_text_alpha: 1,
          video_text_color: 0xffffff
        )
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_text_alpha).to eq 1
        expect(track.video_text_color).to eq 0xffffff
      end

      it 'unsets video banner parameter if empty string is given' do
        track = Fabricate(:track, video_banner_alpha: 1)
        status = Fabricate(:status, account: user.account, music: track)

        patch :update, params: { id: status, video: { banner: '' } }

        track.reload
        expect(track.video_banner_alpha).to eq 0
      end

      it 'does not change video banner parameters if nothing is given' do
        track = Fabricate(:track, video_banner_alpha: 1)
        status = Fabricate(:status, account: user.account, music: track)

        patch :update, params: { id: status }

        track.reload
        expect(track.video_banner_alpha).to eq 1
      end

      it 'returns http success' do
        track = Fabricate(:track)
        status = Fabricate(:status, account: user.account, music: track, reblog: nil)

        patch :update, params: { id: status }

        expect(response).to have_http_status :success
      end

      it 'returns http not found if the given ID is for a track authored by another' do
        track = Fabricate(:track)
        reblog = Fabricate(:status, music: track)
        status = Fabricate(:status, music: track, reblog: nil)

        patch :update, params: { id: status }

        expect(response).to have_http_status :not_found
      end

      it 'returns http not found if the given ID is for a reblog' do
        track = Fabricate(:track)
        reblog = Fabricate(:status, music: track)
        status = Fabricate(:status, account: user.account, music: track, reblog: reblog)

        patch :update, params: { id: status }

        expect(response).to have_http_status :not_found
      end
    end

    context 'without write scope' do
      it 'returns http unauthorized' do
        track = Fabricate(:track)
        status = Fabricate(:status, music: track, reblog: nil)

        patch :update, params: { id: status }

        expect(response).to have_http_status :unauthorized
      end
    end
  end

  describe 'POST #prepare_video' do
    around { |example| Sidekiq::Testing.fake! &example }

    context 'with write scope' do
      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'write')
        end
      end

      let(:user) { Fabricate(:user, admin: false) }
      let(:track) { Fabricate(:track) }

      context 'with origin status authored by self' do
        let(:status) { Fabricate(:status, account: user.account, music: track) }

        it 'queues rendering' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(VideoPreparingWorker).to have_enqueued_sidekiq_job status.id, user.account.id,'720x720'
        end

        it 'returns 422 with invalid resolution' do
          post :prepare_video, params: { id: status, resolution: 'invalid' }
          expect(response).to have_http_status 422
        end

        it 'returns http success' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(response).to have_http_status :success
        end
      end

      context 'with track authored by another' do
        let(:status) { Fabricate(:status, music: track, reblog: nil) }

        it 'returns not found' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(response).to have_http_status :not_found
        end
      end

      context 'with track authored by another if admin account' do
        let(:user) { Fabricate(:user, admin: true) }
        let(:status) { Fabricate(:status, music: track, reblog: nil) }

        it 'queues rendering' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(VideoPreparingWorker).to have_enqueued_sidekiq_job status.id, user.account.id,'720x720'
        end

        it 'returns http success' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(response).to have_http_status :success
        end
      end

      context 'with reblog' do
        let(:reblog) { Fabricate(:status, music: track) }
        let(:status) { Fabricate(:status, account: user.account, music: track, reblog: reblog) }

        it 'returns http not found' do
          post :prepare_video, params: { id: status, resolution: '720x720' }
          expect(response).to have_http_status :not_found
        end
      end
    end

    context 'without write scope' do
      let(:track) { Fabricate(:track) }
      let(:status) { Fabricate(:status, music: track) }

      it 'returns http unauthorized' do
        post :prepare_video, params: { id: status }
        expect(response).to have_http_status :unauthorized
      end
    end
  end
end
