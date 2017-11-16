# frozen_string_literal: true

require 'rails_helper'

describe AlbumsController, type: :controller do
  render_views

  describe 'GET #new' do
    it 'returns http success when signed in' do
      sign_in Fabricate(:user)
      get :new
      expect(response).to have_http_status :success
    end

    it 'redirects when signed out' do
      get :new
      expect(response).to redirect_to 'http://test.host/timelines/public/local'
    end
  end
end
