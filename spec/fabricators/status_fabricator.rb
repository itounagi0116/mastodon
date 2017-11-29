Fabricator(:status) do
  account
  created_at 4.seconds.ago
  text "Lorem ipsum dolor sit amet"

  after_build do |status|
    status.uri = Faker::Internet.device_token if !status.account.local? && status.uri.nil?
  end
end
