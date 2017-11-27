# frozen_string_literal: true

module TimelineConcern
  extend ActiveSupport::Concern

  included do
    layout 'timeline'
    before_action :set_body_classes
  end

  private

  def set_initial_state_json
    serializable_resource = ActiveModelSerializers::SerializableResource.new(InitialStatePresenter.new(initial_state_params), serializer: InitialStateSerializer)
    @initial_state_json   = serializable_resource.to_json
  end

  def initial_state_params
    {
      settings: Web::Setting.find_by(user: current_user)&.data || {},
      push_subscription: current_account&.user&.web_push_subscription(current_session),
      current_account: current_account,
      token: current_session&.token,
      admin: Account.find_local(Setting.site_contact_username),
      target_account: @account,
    }
  end

  def authenticate_user!
    redirect_to(local_timeline_path) unless user_signed_in?
  end

  def set_body_classes
    @body_classes = 'app-body'
  end
end
