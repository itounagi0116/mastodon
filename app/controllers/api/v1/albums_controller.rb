# frozen_string_literal: true

class Api::V1::AlbumsController < Api::BaseController
  include ObfuscateFilename

  before_action -> { doorkeeper_authorize! :write }
  before_action :require_user!

  respond_to :json

  def create
    album = Album.new(album_params)

    if params[:track_ids]
      track_statuses = Status.where(
        id: params[:track_ids],
        music_type: 'Track',
        account: current_account,
        reblog: nil
      ).group_by(&:id)
      lower_position = AlbumTrack::MIN_POSITION
      upper_position = AlbumTrack::MAX_POSITION

      params[:track_ids].each do |track_id|
        track_status = track_statuses[track_id.to_i]&.first
        raise ActiveRecord::RecordNotFound unless track_status

        position = AlbumTrack.position_between(lower_position, upper_position)
        album.album_tracks << AlbumTrack.new(track: track_status.music, position: position)
        lower_position = position
      end
    end
    album.save!

    begin
      status_id = Status.next_id
      status_text = [
        params[:title],
        params[:text].presence,
        short_account_status_url(current_account.username, status_id),
      ].compact.join("\n")

      @status = PostStatusService.new.call(
        current_account,
        status_text,
        nil,
        id: status_id,
        music: album,
        visibility: params[:visibility],
        application: doorkeeper_token.application
      )
    rescue
      album.destroy!
      raise
    end

    render 'api/v1/statuses/show'
  end

  def update
    @status = Status.find_by!(
      id: params[:id],
      account: current_account,
      music_type: 'Album',
      reblog: nil
    )

    @status.music.update! album_params

    render 'api/v1/statuses/show'
  end

  private

  def album_params
    params.permit :title, :text, :image
  end
end
