# frozen_string_literal: true

Recaptcha.configure do |config|
  config.site_key = ENV['RECAPTCHA_SITE_KEY']
  config.secret_key = ENV['RECAPTCHA_SECRET_KEY']
  # 開発環境で試す場合はrecaptchaの設定画面から`localhost`をドメインに追加して、skip_verify_envをコメントアウトする
  # config.skip_verify_env << 'development'
end
