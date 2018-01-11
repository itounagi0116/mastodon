# frozen_string_literal: true

class Api::V1::Accounts::StatusesController < Api::BaseController
  include Authorization

  before_action :set_account
  before_action :validate_params
  after_action :insert_pagination_headers

  respond_to :json

  def index
    @statuses = load_statuses
    render json: @statuses, each_serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new(@statuses, current_user&.account_id)
  end

  private

  def set_account
    @account = Account.find(params[:account_id])
  end

  def validate_params
    if params[:excluded_album]
      if params[:only_tracks].blank?
        raise Mastodon::ValidationError, 'excluded_album parameter is allowed only if only_tracks is set'
      end

      authorize excluded_album_status, :show?
    end
  end

  def load_statuses
    cached_account_statuses
  end

  def cached_account_statuses
    cache_collection account_statuses, Status
  end

  def account_statuses
    default_statuses.tap do |statuses|
      statuses.merge!(only_media_scope) if params[:only_media]
      statuses.merge!(only_musics_scope) if params[:only_musics]
      statuses.merge!(only_tracks_scope) if params[:only_tracks]
      statuses.merge!(only_albums_scope) if params[:only_albums]
      statuses.merge!(pinned_scope) if params[:pinned]
      statuses.merge!(no_replies_scope) if params[:exclude_replies]
      statuses.merge!(no_album_scope) if params[:excluded_album]
    end
  end

  def default_statuses
    permitted_account_statuses.paginate_by_max_id(
      limit_param(DEFAULT_STATUSES_LIMIT),
      params[:max_id],
      params[:since_id]
    )
  end

  def permitted_account_statuses
    @account.statuses.permitted_for(@account, current_account).published
  end

  def only_media_scope
    Status.where(id: account_media_status_ids)
  end

  def only_musics_scope
    Status.musics_only.without_reblogs
  end

  def only_tracks_scope
    Status.tracks_only.without_reblogs
  end

  def only_albums_scope
    Status.albums_only.without_reblogs
  end

  def account_media_status_ids
    @account.media_attachments.attached.where(type: :video).reorder(nil).select(:status_id).distinct
  end

  def pinned_scope
    @account.pinned_statuses
  end

  def no_replies_scope
    Status.without_replies
  end

  def excluded_album_status
    @excluded_album_status ||= Status.find_by!(id: params[:excluded_album], music_type: 'Album')
  end

  def no_album_scope
    Status.joins('LEFT OUTER JOIN album_tracks ON album_tracks.track_id=statuses.music_id')
          .having('coalesce(every(album_tracks.album_id!=?),TRUE)', excluded_album_status.music_id)
          .group(:id)
  end

  def pagination_params(core_params)
    params.permit(:limit, :only_media, :only_musics, :only_tracks, :only_albums, :excluded_album, :exclude_replies).merge(core_params)
  end

  def insert_pagination_headers
    set_pagination_headers(next_path, prev_path)
  end

  def next_path
    if records_continue?
      api_v1_account_statuses_url pagination_params(max_id: pagination_max_id)
    end
  end

  def prev_path
    unless @statuses.empty?
      api_v1_account_statuses_url pagination_params(since_id: pagination_since_id)
    end
  end

  def records_continue?
    @statuses.size == limit_param(DEFAULT_STATUSES_LIMIT)
  end

  def pagination_max_id
    @statuses.last.id
  end

  def pagination_since_id
    @statuses.first.id
  end
end
