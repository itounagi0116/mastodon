require 'rails_helper'

RSpec.describe PostNowPlayingService do
  subject { PostNowPlayingService.new }

  let!(:account) { Fabricate(:account, username: 'now_playing', user: Fabricate(:user)) }
  let!(:application) { Fabricate(:application, name: 'Now playing') }
  let(:post_status_service) { double(:post_status_service) }

  before do
    allow(PostStatusService).to receive(:new).and_return(post_status_service)
  end

  context 'normal channel' do
    it 'calls PostStatusService with channel name' do
      playlist_log = Fabricate(:playlist_log, deck: 1)

      allow(post_status_service).to receive(:call) do |posted_account, text, _, options|
        expect(posted_account).to eq account
        expect(text).to match(/Ch1/)
        expect(options[:application]).to eq application
      end

      subject.call(playlist_log)
      expect(PostStatusService).to have_received(:new)
    end
  end

  context '346 channel' do
    it 'calls PostStatusService with special channel name' do
      playlist_log = Fabricate(:playlist_log, deck: 346)

      allow(post_status_service).to receive(:call) do |posted_account, text, _, options|
        expect(posted_account).to eq account
        expect(text).to match(/Pawoo Music/)
        expect(options[:application]).to eq application
      end

      subject.call(playlist_log)
      expect(PostStatusService).to have_received(:new)
    end
  end
end
