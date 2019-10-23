# frozen_string_literal: true

class Pawoo::Sitemap::StatusIndexesController < ApplicationController
  def index
    @count = Pawoo::Sitemap::Status.page_count
  end

  def show
    page = params[:page]
    sitemap = Pawoo::Sitemap::Status.new(page)
    @accounts = sitemap.cached? ? sitemap.query.load : []
  end
end
