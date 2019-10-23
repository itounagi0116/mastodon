# frozen_string_literal: true

class Pawoo::Sitemap::UserIndexesController < ApplicationController
  def index
    @count = Pawoo::Sitemap::User.page_count
  end

  def show
    page = params[:page]
    sitemap = Pawoo::Sitemap::User.new(page)
    @accounts = sitemap.cached? ? sitemap.query.load : []
  end
end
