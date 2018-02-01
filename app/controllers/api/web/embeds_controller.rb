# frozen_string_literal: true

class Api::Web::EmbedsController < Api::Web::BaseController
  respond_to :json

  def create
    status = StatusFinder.new(params[:url]).status
    width = nil
    height = nil
    extra_params = params.permit(:hideinfo)

    if status.music.is_a? Track
      width = 480
      height = 480
    else
      width = 400
    end

    render json: status, serializer: OEmbedSerializer, width: width, height: height, extra_params: extra_params
  rescue ActiveRecord::RecordNotFound
    oembed = OEmbed::Providers.get(params[:url])
    render json: Oj.dump(oembed.fields)
  rescue OEmbed::NotFound
    render json: {}, status: :not_found
  end
end
