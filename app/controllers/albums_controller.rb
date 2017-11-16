# frozen_string_literal: true

class AlbumsController < ApplicationController
  include TimelineConcern

  before_action :authenticate_user!
  before_action :set_initial_state_data

  layout 'upload'

  def new; end

  def edit
    @status = Status.find_by!(id: params[:id], account: current_account, music_type: 'Album')
  end
end
