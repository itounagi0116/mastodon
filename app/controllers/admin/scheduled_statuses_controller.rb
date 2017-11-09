# frozen_string_literal: true

module Admin
  class ScheduledStatusesController < BaseController
    include TimelineConcern

    before_action :set_initial_state_json, only: :index

    def index; end
  end
end
