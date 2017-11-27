# frozen_string_literal: true

class TimelinesController < ApplicationController
  include TimelineConcern

  before_action :set_initial_state_json, only: :index
  before_action :set_instance_presenter, only: :index

  def index
    render 'home/index'
  end

  def set_instance_presenter
    @instance_presenter = InstancePresenter.new
  end
end
