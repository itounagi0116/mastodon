require 'rails_helper'

RSpec.describe Playlist, type: :model do
  let(:playlist) { Fabricate(:playlist, deck: deck, write_protect: write_protect) }
  let(:deck) { 1 }
  let(:write_protect) { false }
  let(:account) { Fabricate(:account, user: user) }
  let(:user) { Fabricate(:user, admin: admin) }
  let(:admin) { false }

  let(:link) do
    Rails.application.routes.url_helpers.short_account_status_url(status.account.username, status)
  end

  let!(:status) { Fabricate(:status, music: Fabricate(:track, title: 'title', duration: 10)) }

  let(:settings) { { 'max_add_count' => 10, 'max_queue_size' => 10, 'max_skip_count' => 2, 'skip_limit_time' => 0 } }

  around(:example) do |example|
    # 同期的にWorkerの処理が実行されてqueue_itemsが変化するので、同期実行を防ぐ
    Sidekiq::Testing.fake! { example.run }
  end

  before do
    Redis.current.redis.flushdb
  end

  describe '#add' do
    subject { playlist.add(link, account, force) }

    let(:force) { false }

    it { is_expected.to be true }
    it { expect{ subject }.to change { PlaylistLog.count }.by(1) }
    it { expect{ subject }.to change { playlist.queue_items.length }.by(1) }
    it 'deliver by streaming' do
      allow(PushPlaylistWorker).to receive(:perform_async)
      subject
      expect(PushPlaylistWorker).to have_received(:perform_async).with(deck, 'add', playlist.queue_items.first.as_json).once
    end

    context 'when the playlist is empty' do
      before do
        allow(playlist).to receive(:play_item)
      end

      it do
        subject
        expect(playlist).to have_received(:play_item).once
      end
    end

    context 'when the playlist is not empty' do
      before do
        playlist.add(link, account)
        allow(playlist).to receive(:play_item)
      end

      it do
        subject
        expect(playlist).not_to have_received(:play_item)
      end

      context 'over max add count' do
        before do
          allow(playlist).to receive(:settings).and_return(settings.merge({ 'max_add_count' => 1 }))
        end
        it { expect{ subject }.to raise_error(Mastodon::PlayerControlLimitError) }

        context 'is admin' do
          let(:admin) { true }

          it { expect{ subject }.not_to raise_error }
        end
      end

      context 'over max queue size' do
        before do
          allow(playlist).to receive(:settings).and_return(settings.merge({ 'max_queue_size' => 1 }))
        end
        it { expect{ subject }.to raise_error(Mastodon::PlaylistSizeOverError) }
      end
    end

    context 'invalid link' do
      let(:link) { '' }
      it { expect{ subject }.to raise_error(Mastodon::MusicSourceNotFoundError) }
    end

    context 'write_protect is true' do
      let(:write_protect) { true }
      it { expect{ subject }.to raise_error(Mastodon::PlaylistWriteProtectionError) }

      context 'forced' do
        let(:force) { true }
        it { expect{ subject }.not_to raise_error }
      end
    end
  end

  describe '#next' do
    before do
      playlist.add(link, account)
    end

    subject { playlist.next(id) }

    let(:id) { playlist.queue_items.first[:id] }

    it { is_expected.to be true }
    it { expect{ subject }.to change { playlist.queue_items.length }.by(-1) }
    it 'deliver by streaming' do
      allow(PushPlaylistWorker).to receive(:perform_async)
      subject
      expect(PushPlaylistWorker).to have_received(:perform_async).with(deck, 'end', id: id).once
    end

    context 'when the playlist becomes empty' do
      let!(:pixiv_account) { Fabricate(:account, user: user, username: 'pixiv') }

      before do
        allow(playlist).to receive(:play_item)
        allow(playlist).to receive(:add)
      end

      it do
        subject
        expect(playlist).not_to have_received(:play_item)
        expect(playlist).to have_received(:add)
      end
    end

    context 'when the playlist does not becomes empty' do
      before do
        playlist.add(link, account)
        allow(playlist).to receive(:play_item)
      end

      it do
        subject
        expect(playlist).to have_received(:play_item).once
      end
    end

    context 'id other than the first' do
      before do
        playlist.add(link, account)
      end

      context 'second item' do
        let(:id) { playlist.queue_items.second[:id] }
        it { expect{ subject }.to raise_error(Mastodon::PlaylistItemNotFoundError) }
      end

      context 'items that do not exist' do
        let(:id) { '12345' }
        it { expect{ subject }.to raise_error(Mastodon::PlaylistItemNotFoundError) }
      end
    end
  end

  describe '#skip' do
    before do
      playlist.add(link, account)
      allow(playlist).to receive(:settings).and_return(settings)
      allow(playlist).to receive(:current_time_sec).and_return(10)
    end

    subject { playlist.skip(id, account) }

    let(:id) { playlist.queue_items.first[:id] }

    it { is_expected.to be true }
    it { expect{ subject }.to change { playlist.queue_items.length }.by(-1) }
    it { expect{ subject }.to change { PlaylistLog.find_by(uuid: id).skipped_account }.from(nil).to(account) }
    it { expect{ subject }.to change { PlaylistLog.find_by(uuid: id).skipped_at } }
    it 'call #next' do
      allow(playlist).to receive(:next)
      subject
      expect(playlist).to have_received(:next).with(id, String).once
    end

    context 'over max skip count' do
      before do
        allow(playlist).to receive(:settings).and_return(settings.merge({ 'max_skip_count' => 1 }))
        playlist.add(link, account)
        playlist.skip(playlist.queue_items.first[:id], account)
      end
      it { expect{ subject }.to raise_error(Mastodon::PlayerControlLimitError) }

      context 'is admin' do
        let(:admin) { true }

        it { expect{ subject }.not_to raise_error }
      end
    end

    context 'skip time has not come yet' do
      before do
        allow(playlist).to receive(:settings).and_return(settings.merge({ 'skip_limit_time' => 90 }))
      end
      it { expect{ subject }.to raise_error(Mastodon::PlayerControlSkipLimitTimeError) }

      context 'skip limit' do
        let(:admin) { true }

        it { expect{ subject }.not_to raise_error }
      end
    end
  end
end
