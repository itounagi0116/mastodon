Fabricator(:status_pin) do
  account
  status { |attributes| Fabricate(:status, account: attributes[:account]) }
end
