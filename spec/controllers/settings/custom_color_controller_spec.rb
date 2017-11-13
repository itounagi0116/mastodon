require 'rails_helper'

RSpec.describe Settings::CustomColorsController, type: :controller do
  render_views

  before do
    @user = Fabricate(:user)
    sign_in @user, scope: :user
  end

  describe "GET #show" do
    it "returns http success" do
      get :show
      expect(response).to have_http_status(:success)
    end
  end

  describe 'PUT #update' do
    it 'creates custom color' do
      account = Fabricate(:account, user: @user)

      color = {
        textcolor: 10,
        linkcolor: 20,
        linkcolor2: 30,
        strong1: 40,
        strong2: 50,
        color1: 60,
        color2: 70,
        color3: 80
      }

      put :update, params: { account_custom_color: color }
      expect(account.reload.custom_color).to be_a AccountCustomColor
      expect(response).to redirect_to(settings_custom_color_path)
    end

    it 'updates custom color' do
      account = Fabricate(:account, user: @user)
      custom_color = Fabricate(
        :account_custom_color,
        account: account,
        textcolor: 1,
        linkcolor: 2,
        linkcolor2: 3,
        strong1: 4,
        strong2: 5,
        color1: 6,
        color2: 7,
        color3: 8
      )

      new_color = {
        textcolor: 10,
        linkcolor: 20,
        linkcolor2: 30,
        strong1: 40,
        strong2: 50,
        color1: 60,
        color2: 70,
        color3: 80
      }
      put :update, params: { account_custom_color: new_color }

      expect(custom_color.reload.textcolor).to eq 10
      expect(custom_color.reload.linkcolor).to eq 20
      expect(custom_color.reload.linkcolor2).to eq 30
      expect(custom_color.reload.strong1).to eq 40
      expect(custom_color.reload.strong2).to eq 50
      expect(custom_color.reload.color1).to eq 60
      expect(custom_color.reload.color2).to eq 70
      expect(custom_color.reload.color3).to eq 80

      expect(response).to redirect_to(settings_custom_color_path)
    end
  end

  describe 'DELETE #destroy' do
    it 'delete custom color' do
      account = Fabricate(:account, user: @user)
      Fabricate(:account_custom_color, account: account)

      delete :destroy

      expect(account.reload.custom_color).to eq nil
      expect(response).to redirect_to(settings_custom_color_path)
    end
  end
end
