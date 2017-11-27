# frozen_string_literal: true

class Settings::FollowRequestsController < ApplicationController
  include TimelineConcern

  layout 'settings'

  before_action :authenticate_user!
  before_action :set_initial_state_json, only: :show

  def show; end
end
