# frozen_string_literal: true

require 'rails_helper'

describe Track, type: :model do
  describe '#display_title' do
    it 'returns title for display' do
      track = Fabricate(:track, title: 'title', artist: 'artist')
      expect(track.display_title).to eq 'artist - title'
    end
  end

  it 'does not truncate title when it is not changed' do
    track = Fabricate(:track)
    track.update! artist: Faker::Name.name
    expect(track.previous_changes[:title]).to eq nil
  end

  it 'truncates title after 128 characters after it is changed' do
    track = Fabricate(:track, title: 'This is a text which is longer than 128 characters. A string, "hello!!!!!!" should be stripped from the end of the whole string. hello!!!!!!')
    expect(track.title).to eq 'This is a text which is longer than 128 characters. A string, "hello!!!!!!" should be stripped from the end of the whole string.'
  end

  it 'does not truncate artist when it is not changed' do
    track = Fabricate(:track)
    track.update! title: Faker::Name.name
    expect(track.previous_changes[:artist]).to eq nil
  end

  it 'truncates artist after 128 characters before saving' do
    track = Fabricate(:track, artist: 'This is a text which is longer than 128 characters. A string, "hello!!!!!!" should be stripped from the end of the whole string. hello!!!!!!')
    expect(track.artist).to eq 'This is a text which is longer than 128 characters. A string, "hello!!!!!!" should be stripped from the end of the whole string.'
  end
end
