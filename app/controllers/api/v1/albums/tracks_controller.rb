# frozen_string_literal: true

class Api::V1::Albums::TracksController < Api::BaseController
  before_action -> { doorkeeper_authorize! :write }, except: :index
  before_action :require_user!, except: :index
  rescue_from Mastodon::TrackNotFoundError, with: :render_track_not_found

  respond_to :json

  def update
    if album_status.account != current_account || track_status.account != current_account
      raise Mastodon::ValidationError
    end

    position = AlbumTrack.position_between(*entry_range)

    if request.put?
      album_track = AlbumTrack.find_by(
        album: album_status.music,
        track: track_status.music
      )

      if album_track.nil?
        AlbumTrack.create!(
          album: album_status.music,
          track: track_status.music,
          position: position
        )
      else
        album_track.update! position: position
      end
    else
      AlbumTrack.find_by!(
        album: album_status.music,
        track: track_status.music
      ).update! position: position
    end

    render_empty
  end

  def destroy
    if album_status.account != current_account || track_status.account != current_account
      raise Mastodon::ValidationError
    end

    album_track_scope.find_by!(track: track_status.music).destroy!
    render_empty
  end

  def index
    index_scope = album_track_scope.order(:position)

    if index_range[0].present?
      index_scope = index_scope.where('position > ?', index_range[0])
    end

    if index_range[1].present?
      index_scope = index_scope.where('position < ?', index_range[1])
    end

    @statuses = Status.reorder(nil).where(
      reblog: nil,
      music: Track.joins(:album_tracks)
                  .merge(index_scope)
                  .limit(limit_param(DEFAULT_TRACKS_LIMIT))
    )

    insert_pagination_headers
    render 'api/v1/statuses/index'
  end

  private

  def render_track_not_found
    render json: { error: I18n.t('albums.tracks.positioning_not_found') }, status: :unprocessable_entity
  end

  def entry_range
    return @entry_range if @entry_range

    relative_to_id = params[:relative_to]
    above = ActiveRecord::Type.lookup(:boolean).cast(params[:above])
    lower_position = AlbumTrack::MIN_POSITION
    upper_position = AlbumTrack::MAX_POSITION

    if relative_to_id.nil?
      if above
        upper = album_track_scope.order(:position).first
        upper_position = upper.position if upper
      else
        lower = album_track_scope.order(:position).last
        lower_position = lower.position if lower
      end
    else
      relative_to_status = Status.find_by!(
        id: relative_to_id,
        music_type: 'Track',
        reblog: nil,
        account: current_account
      )
      relative_to = album_track_scope.find_by!(track: relative_to_status.music)

      if above
        lower = album_track_scope.find_by('position < ?', relative_to.position)
        lower_position = lower.position if lower
        upper_position = relative_to.position
      else
        upper = album_track_scope.find_by('position > ?', relative_to.position)
        lower_position = relative_to.position
        upper_position = upper.position if upper
      end
    end

    @entry_range = [lower_position, upper_position]
  end

  def index_range
    return @index_range if @index_range

    lower_id = params[:since_id]&.to_i
    upper_id = params[:max_id]&.to_i

    positioning_ids = [lower_id, upper_id].compact

    lower_position = nil
    upper_position = nil

    positioning_attributes = album_track_scope.where(track_id: positioning_ids)
                                              .pluck(:track_id, :position)

    if positioning_attributes.size < positioning_ids.size
      raise Mastodon::TrackNotFoundError
    end

    positioning_attributes.each do |attributes|
      case attributes[0]
      when lower_id
        lower_position = attributes[1]
      when upper_id
        upper_position = attributes[1]
      end
    end

    if upper_position.present? && lower_position.present? && upper_position <= lower_position
      raise Mastodon::ValidationError, I18n.t('albums.tracks.invalid_range')
    end

    @index_range = [lower_position, upper_position]
  end

  def album_track_scope
    AlbumTrack.where(album: album_status.music)
  end

  def album_status
    @album_status ||= Status.find_by!(
      id: params.require(:album_id),
      music_type: 'Album',
      reblog: nil
    )
  end

  def track_status
    @track_status ||= Status.find_by!(
      id: params.require(:id),
      music_type: 'Track',
      reblog: nil
    )
  end

  def pagination_params(core_params)
    params.permit(:limit).merge(core_params)
  end

  def insert_pagination_headers
    set_pagination_headers(next_path, prev_path)
  end

  def next_path
    unless @statuses.empty?
      api_v1_album_tracks_url pagination_params(since_id: pagination_since_id)
    end
  end

  def prev_path
    if records_continue?
      api_v1_album_tracks_url pagination_params(max_id: pagination_max_id)
    end
  end

  def records_continue?
    @statuses.size == limit_param(DEFAULT_TRACKS_LIMIT)
  end

  def pagination_max_id
    @statuses.last.id
  end

  def pagination_since_id
    @statuses.first.id
  end

  def insert_pagination_headers
    set_pagination_headers(next_path, prev_path)
  end
end
