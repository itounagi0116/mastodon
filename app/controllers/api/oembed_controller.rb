# frozen_string_literal: true

class Api::OEmbedController < Api::BaseController
  respond_to :json

  def show
    @stream_entry = find_stream_entry.stream_entry
    @width = maxwidth_or_default
    @height = maxheight_or_default
  end

  private

  def find_stream_entry
    StreamEntryFinder.new(params[:url])
  end

  def maxwidth_or_default
    (params[:maxwidth].presence || default_width).to_i
  end

  def maxheight_or_default
    params[:maxheight].present? ? params[:maxheight].to_i : default_height
  end

  def default_width
    @stream_entry.status.music.is_a?(Track) ? 480 : 400
  end

  def default_height
    @stream_entry.status.music.is_a?(Track) ? (maxwidth_or_default + 32) : nil
  end
end
