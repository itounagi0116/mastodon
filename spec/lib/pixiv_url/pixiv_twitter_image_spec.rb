# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PixivUrl::PixivTwitterImage do
  describe '#fetch_image_url' do
    subject { described_class.cache_or_fetch(url, force: true) }

    context 'when oembed is supported' do
      before do
        stub_request(:get, url)
          .to_return(status: 200, body: File.read('spec/fixtures/pixiv/artworks_page.html'), headers: { 'Content-Type' => 'text/html' })
        stub_request(:get, 'https://www.pixiv.net/oembed/?url=https%3A%2F%2Fwww.pixiv.net%2Fartworks%2F62406690')
          .to_return(status: 200, body: File.read('spec/fixtures/pixiv/oembed_page.html'), headers: { 'Content-Type' => 'application/json' })
      end

      let(:url) { 'https://www.pixiv.net/artworks/62406690' }

      it 'fetch oembed image from url' do
        is_expected.to eq('https://embed.pixiv.net/decorate.php?illust_id=62406690&mode=sns-automator')
      end
    end

    context 'when opengraph is supported' do
      before do
        stub_request(:get, url)
          .to_return(status: 200, body: File.read('spec/fixtures/pixiv/novel_page.html'), headers: { 'Content-Type' => 'text/html' })
      end

      let(:url) { 'https://www.pixiv.net/novel/show.php?id=129' }

      it 'fetch oembed image from url' do
        is_expected.to eq('https://embed.pixiv.net/novel.php?id=129&mdate=20140502193143')
      end
    end
  end
end
