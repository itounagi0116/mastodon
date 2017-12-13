require 'rails_helper'

RSpec.describe Notification, type: :model do
  describe '#from_account' do
    pending
  end

  describe '#type' do
    it 'returns :reblog for a Status' do
      notification = Notification.new(activity: Status.new)
      expect(notification.type).to eq :reblog
    end

    it 'returns :mention for a Mention' do
      notification = Notification.new(activity: Mention.new)
      expect(notification.type).to eq :mention
    end

    it 'returns :favourite for a Favourite' do
      notification = Notification.new(activity: Favourite.new)
      expect(notification.type).to eq :favourite
    end

    it 'returns :follow for a Follow' do
      notification = Notification.new(activity: Follow.new)
      expect(notification.type).to eq :follow
    end

    it 'returns :new_track for a Track with from_account' do
      notification = Notification.new(activity: Fabricate(:track), from_account: Fabricate(:account))
      expect(notification.type).to eq :new_track
    end

    it 'returns :video_preparation_success for a Track without from_account' do
      notification = Notification.new(activity: Fabricate(:track), from_account: nil)
      expect(notification.type).to eq :video_preparation_success
    end
  end
end
