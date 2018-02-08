# frozen_string_literal: true

class Api::OEmbedController < Api::BaseController
  respond_to :json

  def show
    @status = status_finder.status
    extra_params = params.permit(:hideinfo)

    render json: @status, serializer: OEmbedSerializer, extra_params: extra_params, **size
  end

  private

  def status_finder
    StatusFinder.new(params[:url])
  end

  def size
    @status.music.present? ? music_size : status_size
  end

  def status_size
    { width: maxwidth_or_default, height: maxheight_or_default }
  end

  def maxwidth_or_default
    (params[:maxwidth].presence || default_width).to_i
  end

  def maxheight_or_default
    params[:maxheight].present? ? params[:maxheight].to_i : default_height
  end

  def default_width
    400
  end

  def default_height
    nil
  end

  def music_size
    sizes = [params[:maxwidth], params[:maxheight]].compact!
    if sizes.empty?
      { width: 480, height: 480 }
    else
      min = sizes.min
      { width: min, height: min }
    end
  end
end
