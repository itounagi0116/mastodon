# frozen_string_literal: true

require 'rails_helper'

describe VideoPreparingWorker do
  describe 'perform' do
    let(:user) { Fabricate(:user) }
    let(:track) { Fabricate(:track) }
    let(:status) { Fabricate(:status, account: user.account, music: track) }

    # 720x720 is expected to allow to post the video to Instagram and Twitter.
    #
    # Video Views: Instagram Video | Facebook Ads Guide
    # https://www.facebook.com/business/ads-guide/video-views/instagram-video-views
    # > Minimum resolution: 600 x 315 pixels (1.91:1 landscape) / 600 x 600
    # > pixels (1:1 square) / 600 x 750 pixels (4:5 vertical)
    #
    # Media Best Practices — Twitter Developers
    # https://developer.twitter.com/en/docs/media/upload-media/uploading-media/media-best-practices
    # > Dimensions should be between 32x32 and 1280x1024
    # > Aspect ratio should be between 1:3 and 3:1
    it 'prepares 720x720' do
      VideoPreparingWorker.new.perform status.id, user.account.id, '720x720'

      status.reload
      expect(track.video).not_to eq nil
    end

    it 'prepares 1920x1080' do
      VideoPreparingWorker.new.perform status.id, user.account.id, '1920x1080'

      status.reload
      expect(track.video_1920x1080).not_to eq nil
    end

    it 'notifies finish of preparation' do
      VideoPreparingWorker.new.perform status.id, user.account.id, '720x720'

      expect do
        Notification.find_by!(account: user.account, activity: track)
      end.not_to raise_error
    end

    it 'does not raise even if attachment is being removed in race condition' do
      expect do
        VideoPreparingWorker.new.perform 1, user.account.id, '720x720'
      end.not_to raise_error
    end
  end
end
