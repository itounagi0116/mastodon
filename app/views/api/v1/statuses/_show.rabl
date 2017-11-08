attributes :id, :created_at, :in_reply_to_id,
           :in_reply_to_account_id, :sensitive,
           :spoiler_text, :visibility, :language

node(:uri)              { |status| TagManager.instance.uri_for(status) }
node(:content)          { |status| Formatter.instance.format(status) }
node(:text)             { |status| Formatter.instance.plaintext(status) }
node(:url)              { |status| TagManager.instance.url_for(status) }
node(:reblogs_count)    { |status| defined?(@reblogs_counts_map)    ? (@reblogs_counts_map[status.id]    || 0) : status.reblogs_count }
node(:favourites_count) { |status| defined?(@favourites_counts_map) ? (@favourites_counts_map[status.id] || 0) : status.favourites_count }
node(:pixiv_cards)      { |status| status.pixiv_cards.select(&:image_url?).map { |record| record.slice(:url, :image_url) }.compact }
node(:pinned)           { |status| status.pinned_status.present? }
node(:booth_item_url)   { |status| BoothUrl.extract_booth_item_url(Formatter.instance.plaintext(status)) }
node(:booth_item_id) do |status|
  text = Formatter.instance.plaintext(status)
  BoothUrl.extract_booth_item_id(text) || BoothUrl.extract_apollo_item_id(text)
end

child :application do
  extends 'api/v1/apps/show'
end

child :account do
  extends 'api/v1/accounts/show'
end

# pawoo iOSが対応していないので、一時的に除外する。🍺 飲みたい
child({ @object.media_attachments.reject(&:unknown?) => :media_attachments }, object_root: false) do
  extends 'api/v1/statuses/_media'
end

child :mentions, object_root: false do
  extends 'api/v1/statuses/_mention'
end

child :tags, object_root: false do
  extends 'api/v1/statuses/_tags'
end

root_status = root_object

child({ music: :album }, if: ->(status) { !status.reblog? && status.music.is_a?(Album) }) do
  attribute :title, :text, :tracks_count

  node(:content) { |album| Formatter.instance.format_for_music(album) }
  node(:image) { |album| full_asset_url(album.image.url(:original)) }
  node(:preview_url) { |album| full_asset_url(album.image.url(:small)) }
end

child({ music: :track }, if: ->(status) { !status.reblog? && status.music.is_a?(Track) }) do
  extends 'api/v1/statuses/_track', locals: { show_video_url: current_account && root_status.account_id == current_account.id }
end
