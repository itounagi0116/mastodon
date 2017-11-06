# frozen_string_literal: true

class Api::V1::AlbumsController < Api::BaseController
  before_action -> { doorkeeper_authorize! :write }
  before_action :require_user!

  respond_to :json

  def create
    album = Album.create!(
      title: params.require(:title),
      text: params.require(:text),
      image: params.require(:image)
    )

    begin
      status_id = Status.next_id
      status_text = short_account_status_url(current_account.username, status_id)
      unless params[:text].blank?
        status_text = [params[:text], status_text].join(' ')
      end

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
      id: params.require(:id),
      account: current_account,
      music_type: 'Album',
      reblog: nil
    )

    @status.music.update! params.permit(:title, :text, :image)

    render 'api/v1/statuses/show'
  end
end
