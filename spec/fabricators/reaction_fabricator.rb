Fabricator :reaction do
  track { Fabricate :track }
  text { Reaction::PERMITTED_TEXTS.sample }
end
