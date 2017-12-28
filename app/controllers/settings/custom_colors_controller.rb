# frozen_string_literal: true

class Settings::CustomColorsController < ApplicationController
  include TimelineConcern

  layout 'settings'

  before_action :authenticate_user!
  before_action :set_account
  before_action :set_custom_color, only: [:show, :update]
  before_action :set_initial_state_json, only: :show

  def show; end

  def update
    if @custom_color.update(custom_color_params)
      redirect_to settings_custom_color_path, notice: I18n.t('generic.changes_saved_msg')
    else
      render :show
    end
  end

  def destroy
    @account.custom_color&.destroy

    redirect_to settings_custom_color_path, notice: I18n.t('generic.changes_saved_msg')
  end

  private

  def custom_color_params
    params.require(:account_custom_color).permit(
      :textcolor,
      :linkcolor,
      :linkcolor2,
      :strong1,
      :strong2,
      :color1,
      :color2,
      :color3
    )
  end

  def set_account
    @account = current_user.account
  end

  def set_custom_color
    @custom_color = @account.custom_color || @account.build_custom_color
  end
end
