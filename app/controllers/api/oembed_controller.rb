# frozen_string_literal: true

class Api::OEmbedController < Api::BaseController
  respond_to :json

  def show
    @status = status_finder.status
    extra_params = params.permit(:hideinfo)

    render json: @status, serializer: OEmbedSerializer, width: maxwidth_or_default, height: maxheight_or_default, extra_params: extra_params
  end

  private

  def status_finder
    StatusFinder.new(params[:url])
  end

  def maxwidth_or_default
    (params[:maxwidth].presence || default_width).to_i
  end

  def maxheight_or_default
    params[:maxheight].present? ? params[:maxheight].to_i : default_height
  end

  def default_width
    @status.music.is_a?(Track) ? '100%' : 400
  end

  def default_height
    nil
  end
end
