require 'rails_helper'

RSpec.describe PixivCardUpdateWorker do
  describe '#perform' do
    subject do
      -> { described_class.new.perform(status.id) }
    end

    let!(:status) { Fabricate(:status) }
    let!(:pixiv_card) { Fabricate(:pixiv_card, url: url, status: status) }
    let(:url) { 'https://www.pixiv.net/novel/show.php?id=129' }

    before do
      allow(Rails.cache).to receive(:read_entry).and_return(nil)

      stub_request(:get, url)
        .to_return(status: status_code, body: File.read('spec/fixtures/pixiv/novel_page.html'), headers: { 'Content-Type' => 'text/html' })
    end

    context 'successfully fetched html' do
      let(:status_code) { 200 }

      it 'fetch image url from pixiv' do
        is_expected.to change {
          pixiv_card.reload.image_url?
        }.from(false).to(true)
      end
    end

    context 'failed fetching html' do
      let(:status_code) { 404 }

      it 'destroys pixiv_card' do
        is_expected.to change {
          PixivCard.where(id: pixiv_card.id).exists?
        }.from(true).to(false)
      end
    end
  end
end
