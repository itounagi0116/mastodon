# frozen_string_literal: true

class Api::Web::EmbedsController < Api::BaseController
  respond_to :json

  before_action :require_user!

  def create
    @stream_entry = StreamEntryFinder.new(params[:url]).stream_entry
    @width = @stream_entry.status.music.is_a?(Track) ? '480' : '400'
    @height = @stream_entry.status.music.is_a?(Track) ? '512' : nil

    render 'api/oembed/show.json'
  rescue ActiveRecord::RecordNotFound
    oembed = OEmbed::Providers.get(params[:url])
    render json: Oj.dump(oembed.fields)
  rescue OEmbed::NotFound
    render json: {}, status: :not_found
  end
end
