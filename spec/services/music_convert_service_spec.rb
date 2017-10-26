# frozen_string_literal: true

require 'rails_helper'

describe MusicConvertService do
  it 'converts into a video file with specified options' do
    extend ActionDispatch::TestProcess

    track = Fabricate(
      :track,
      title: 'title',
      artist: 'artist',
      music: fixture_file_upload('files/high.mp3'),
      video_image: fixture_file_upload('files/attachment.jpg'),
    )

    file = MusicConvertService.new.call(track)

    expect(`ffprobe -v error -show_entries tags=title -of default=noprint_wrappers=1:nokey=1 #{file.path}`).to eq "title\n"
    expect(`ffprobe -v error -show_entries tags=artist -of default=noprint_wrappers=1:nokey=1 #{file.path}`).to eq "artist\n"
  end
end
