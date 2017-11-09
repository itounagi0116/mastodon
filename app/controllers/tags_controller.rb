# frozen_string_literal: true

class TagsController < ApplicationController
  include TimelineConcern

  before_action :set_initial_state_json, only: :show

  def show
    @tag_name            = params[:id].downcase
    @tag                 = Tag.find_by(name: @tag_name)

    respond_to do |format|
      format.html

      format.json do
        @statuses            = Status.as_tag_timeline(@tag, current_account, params[:local]).page(params[:page]).per(STATUSES_PER_PAGE).without_count
        @statuses_collection = cache_collection(@tag.nil? ? [] : @statuses, Status)

        render json: collection_presenter, serializer: ActivityPub::CollectionSerializer, adapter: ActivityPub::Adapter, content_type: 'application/activity+json'
      end
    end
  end

  private

  def collection_presenter
    ActivityPub::CollectionPresenter.new(
      id: tag_url(@tag),
      type: :ordered,
      size: @tag.statuses.count,
      items: @statuses.map { |s| ActivityPub::TagManager.instance.uri_for(s) }
    )
  end
end
