# frozen_string_literal: true

class TracksController < ApplicationController
  include TimelineConcern

  before_action :authenticate_user!
  before_action :set_initial_state_json

  layout 'upload'

  def new; end

  def edit
    @status = Status.find_by!(id: params[:id], account: current_account, music_type: 'Track')
    @status_json = ActiveModelSerializers::SerializableResource.new(@status, serializer: REST::StatusSerializer, scope: current_user, scope_name: :current_user).to_json
  end
end
