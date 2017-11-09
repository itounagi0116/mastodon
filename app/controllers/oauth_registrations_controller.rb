class OauthRegistrationsController < DeviseController
  include WithRedisSessionStore

  layout 'auth'

  before_action :require_omniauth_auth
  before_action :require_no_authentication
  before_action :set_oauth_registration

  def new; end

  def create
    @oauth_registration.assign_attributes(oauth_registration_params)

    if @oauth_registration.save
      BootstrapTimelineWorker.perform_async(@oauth_registration.user.account_id)
      sign_in(@oauth_registration.user)
      DefaultFollowWorker.perform_async(@oauth_registration.user.account_id)

      redirect_to after_sign_in_path_for(@oauth_registration.user)
    elsif @oauth_registration.errors.added?(:email, :taken)
      redirect_to new_user_session_path, alert: t('.already_registered')
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_oauth_registration
    @oauth_registration = Form::OauthRegistration.from_omniauth_auth(omniauth_auth)
  end

  def require_omniauth_auth
    redirect_to root_path, alert: t('devise.failure.timeout') unless omniauth_auth
  end

  def omniauth_auth
    @omniauth_auth ||= JSON.parse(redis_session_store('devise.omniauth').get('auth'))
  rescue TypeError, JSON::ParserError
    nil
  end

  def oauth_registration_params
    params.require(:form_oauth_registration).permit(
      :email, :username
    ).merge(locale: I18n.locale)
  end
end
