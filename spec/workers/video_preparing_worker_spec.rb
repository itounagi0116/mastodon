# frozen_string_literal: true

require 'rails_helper'

describe VideoPreparingWorker do
  describe 'perform' do
    let(:user) { Fabricate(:user) }
    let(:track) { Fabricate(:track) }
    let(:status) { Fabricate(:status, account: user.account, music: track) }

    it 'prepares video' do
      VideoPreparingWorker.new.perform status.id

      status.reload
      expect(track.video).not_to eq nil
    end

    it 'notifies finish of preparation' do
      VideoPreparingWorker.new.perform status.id

      expect do
        Notification.find_by!(account: user.account, activity: track)
      end.not_to raise_error
    end

    it 'does not raise even if attachment is being removed in race condition' do
      expect do
        VideoPreparingWorker.new.perform 1
      end.not_to raise_error
    end
  end
end
