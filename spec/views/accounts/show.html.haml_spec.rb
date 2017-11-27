# frozen_string_literal: true

require 'rails_helper'

describe 'accounts/show.html.haml', without_verify_partial_doubles: true do
  it 'has valid opengraph tags' do
    alice   =  Fabricate(:account, username: 'alice', display_name: 'Alice')
    assign(:account, alice)

    render

    header_tags = view.content_for(:header_tags)

    expect(header_tags).to match(%r{<meta content=".+" property="og:title" />})
    expect(header_tags).to match(%r{<meta content="profile" property="og:type" />})
    expect(header_tags).to match(%r{<meta content=".+" property="og:image" />})
    expect(header_tags).to match(%r{<meta content="http://.+" property="og:url" />})
  end

  it 'has link header for federation' do
    alice   =  Fabricate(:account, username: 'alice', display_name: 'Alice')
    assign(:account, alice)

    render

    header_tags = view.content_for(:header_tags)

    expect(header_tags).to match(%r{<link href='.+' rel='salmon'>})
    expect(header_tags).to match(%r{<link href='.+' rel='alternate' type='application/atom\+xml'>})
    expect(header_tags).to match(%r{<link href='.+' rel='alternate' type='application/activity\+json'>})
  end

  it 'does not have link header for federation when remote account' do
    alice   =  Fabricate(:account, username: 'alice', display_name: 'Alice', domain: 'example.com')
    assign(:account, alice)

    render

    header_tags = view.content_for(:header_tags)

    expect(header_tags).not_to match(%r{<link href='.+' rel='salmon'>})
    expect(header_tags).not_to match(%r{<link href='.+' rel='alternate' type='application/atom\+xml'>})
    expect(header_tags).not_to match(%r{<link href='.+' rel='alternate' type='application/activity\+json'>})
  end
end
