object @account

attributes :id, :username, :acct, :display_name, :locked, :created_at

node(:note)            { |account| Formatter.instance.simplified_format(account) }
node(:url)             { |account| TagManager.instance.url_for(account) }
node(:avatar)          { |account| full_asset_url(account.avatar_original_url) }
node(:avatar_static)   { |account| full_asset_url(account.avatar_static_url) }
node(:header)          { |account| full_asset_url(account.header_original_url) }
node(:header_static)   { |account| full_asset_url(account.header_static_url) }
node(:background_image){ |account| account.background_image.present? ? full_asset_url(account.background_image.url(:original)) : nil }

attributes :followers_count, :following_count, :statuses_count, :tracks_count, :albums_count

child :oauth_authentications, object_root: false do
  attribute(:uid, :provider)
end

child({ custom_color: :custom_color }, object_root: false) do
  attributes :textcolor, :linkcolor, :linkcolor2, :strong1, :strong2, :color1, :color2, :color3
end
