# frozen_string_literal: true

class Api::Web::EmbedsController < Api::BaseController
  respond_to :json

  before_action :require_user!

  def create
    status = StatusFinder.new(params[:url]).status
    width = status.music.is_a?(Track) ? '100%' : 400
    extra_params = params.permit(:hideinfo)

    render json: status, serializer: OEmbedSerializer, width: width, extra_params: extra_params
  rescue ActiveRecord::RecordNotFound
    oembed = OEmbed::Providers.get(params[:url])
    render json: Oj.dump(oembed.fields)
  rescue OEmbed::NotFound
    render json: {}, status: :not_found
  end
end
