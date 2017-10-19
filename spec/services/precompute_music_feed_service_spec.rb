# frozen_string_literal: true

require 'rails_helper'

describe PrecomputeMusicFeedService do
  subject { PrecomputeMusicFeedService.new }

  describe 'call' do
    let(:account) { Fabricate(:account) }
    it 'fills a user music timeline with statuses' do
      account = Fabricate(:account)
      followed_account = Fabricate(:account)
      Fabricate(:follow, account: account, target_account: followed_account)
      music = Fabricate(:track)
      reblog = Fabricate(:status, account: followed_account, music: music)
      status = Fabricate(:status, account: account, reblog: reblog, music: music)

      subject.call(account)

      expect(Redis.current.zscore(FeedManager.instance.music_key(:home, account.id), reblog.id)).to eq status.id
    end

    it 'does not fill a user music timeline with statuses which no musics are attached to' do
      account = Fabricate(:account)
      followed_account = Fabricate(:account)
      Fabricate(:follow, account: account, target_account: followed_account)
      reblog = Fabricate(:status, account: followed_account, music: nil)
      status = Fabricate(:status, account: account, reblog: reblog, music: nil)

      subject.call(account)

      expect(Redis.current.zscore(FeedManager.instance.music_key(:home, account.id), reblog.id)).to eq nil
    end

    it 'does not raise an error even if it could not find any status' do
      account = Fabricate(:account)
      subject.call(account)
    end

    it 'filters music statuses' do
      account = Fabricate(:account)
      muted_account = Fabricate(:account)
      Fabricate(:mute, account: account, target_account: muted_account)
      music = Fabricate(:track)
      reblog = Fabricate(:status, account: muted_account, music: music)
      status = Fabricate(:status, account: account, reblog: reblog, music: music)

      subject.call(account)

      expect(Redis.current.zscore(FeedManager.instance.key(:home, account.id), reblog.id)).to eq nil
    end
  end
end
