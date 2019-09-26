# frozen_string_literal: true

module Pawoo::Auth::RegistrationsControllerConcern
  extend ActiveSupport::Concern

  included do
    before_action :store_current_location, only: [:edit]
    before_action :check_captcha, only: [:create]
  end

  def update
    if current_user.initial_password_usage
      pawoo_send_reset_password_instructions
    else
      super
    end
  end

  private

  def check_captcha
    unless verify_recaptcha
      build_resource(sign_up_params)
      resource.validate # Look for any other validation errors besides Recaptcha
      set_minimum_password_length
      render :new
    end
  end

  def pawoo_send_reset_password_instructions
    resource = resource_class.send_reset_password_instructions(email: current_user.email)

    if successfully_sent?(resource)
      redirect_to edit_user_registration_path
    else
      render :edit, status: :unprocessable_entity
    end
  end
end
