# frozen_string_literal: true

class StatusesController < ApplicationController
  include Authorization
  include TimelineConcern

  before_action :set_account
  before_action :set_status
  before_action :check_account_suspension
  before_action :redirect_to_original, only: [:show]
  before_action :set_initial_state_json, only: :show

  def show
    respond_to do |format|
      format.html do
        @status_pagination = StatusPagination.new(@status, current_account)
        set_link_headers(@status_pagination.previous, @status_pagination.next)

        render 'stream_entries/show'
      end

      format.json do
        raise ActiveRecord::RecordNotFound if !@account.local? || TimeLimit.from_tags(@status.tags)
        render json: @status, serializer: ActivityPub::NoteSerializer, adapter: ActivityPub::Adapter, content_type: 'application/activity+json'
      end
    end
  end

  def activity
    raise ActiveRecord::RecordNotFound if !@account.local? || TimeLimit.from_tags(@status.tags)
    render json: @status, serializer: ActivityPub::ActivitySerializer, adapter: ActivityPub::Adapter, content_type: 'application/activity+json'
  end

  def embed
    response.headers['X-Frame-Options'] = 'ALLOWALL'
    raise ActiveRecord::RecordNotFound unless @account.local?

    if @status.music.is_a?(Track)
      initial_state_params = {
        current_account: current_account,
        token: current_session&.token,
        reactions: Reaction::PERMITTED_TEXTS,
      }
      initial_state = ActiveModelSerializers::SerializableResource.new(InitialStatePresenter.new(initial_state_params), serializer: InitialStateSerializer)
      @initial_state_json = initial_state.to_json
      @status_json = ActiveModelSerializers::SerializableResource.new(@status, serializer: REST::StatusSerializer, scope: current_user, scope_name: :current_user).to_json

      render 'stream_entries/musicvideo', layout: 'embedded'
    else
      render 'stream_entries/embed', layout: 'embedded'
    end
  end

  private

  def set_account
    username, domain = (params[:account_username] || '').split('@')
    @account = Account.find_by!(username: username, domain: domain)
  end

  def set_link_headers(prev_status, next_status)
    response.headers['Link'] = LinkHeader.new(
      [
        ([account_stream_entry_url(@account, @status.stream_entry, format: 'atom'), [%w(rel alternate), %w(type application/atom+xml)]] if @account.local?),
        ([ActivityPub::TagManager.instance.uri_for(@status), [%w(rel alternate), %w(type application/activity+json)]] if @account.local?),
        ([short_account_status_path(@account, prev_status), [%w(rel prev)]] if prev_status),
        ([short_account_status_path(@account, next_status), [%w(rel next)]] if next_status),
      ].compact
    )
  end

  def set_status
    @status       = @account.statuses.find(params[:id])
    @stream_entry = @status.stream_entry
    @type         = @stream_entry&.activity_type&.downcase

    authorize @status, :show?
  rescue Mastodon::NotPermittedError
    # Reraise in order to get a 404
    raise ActiveRecord::RecordNotFound
  end

  def check_account_suspension
    gone if @account.suspended?
  end

  def redirect_to_original
    redirect_to ::TagManager.instance.url_for(@status.reblog) if @status.reblog?
  end
end
