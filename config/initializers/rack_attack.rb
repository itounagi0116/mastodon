# frozen_string_literal: true

require 'doorkeeper/grape/authorization_decorator'

class Rack::Attack
  LIMIT = 60
  PERIOD = 1.minute

  BLACK_LIST_IPS = [
    '118.241.187.114', # 不正アカウント作成
    '60.108.149.247',  # botで負荷かける
    '122.196.21.73',   # 不正アカウント作成
    '153.203.141.229', # 不正アカウント作成
    '60.86.227.33'     # 不正アカウント作成
  ].freeze

  def self.push_temporary_blacklist(value)
    Redis.current.sadd("Rack::Attack:temporary_blacklist", value)
  end

  # Always allow requests from localhost
  # (blocklist & throttles are skipped)
  safelist('allow from localhost') do |req|
    # Requests are allowed if the return value is truthy
    '127.0.0.1' == req.ip || '::1' == req.ip
  end

  blocklist('bot users') do |req|
    BLACK_LIST_IPS.include?(req.ip)
  end

  # Rate limits for the API
  # throttle('api_ip', limit: 300, period: PERIOD) do |req|
  #   req.ip if req.path =~ /\A\/api\/v/
  # end

  # Rate limits for the API
  throttle('api_access_token', limit: LIMIT, period: PERIOD) do |req|
    next unless req.post? && req.path.start_with?('/api/v1') && (req.path =~ /follow/ || req.path == '/api/v1/statuses')

    # return access_token
    decorated_request = Doorkeeper::Grape::AuthorizationDecorator.new(req)
    Doorkeeper::OAuth::Token.from_request(decorated_request, *Doorkeeper.configuration.access_token_methods)
  end

  throttle('accounts_follow_unfollow', limit: LIMIT, period: PERIOD) do |req|
    req.ip if req.post? && req.path =~ %r{\A/users/[^/]+/(?:follow|unfollow)}
  end

  # Rate limit logins
  throttle('login', limit: LIMIT, period: PERIOD) do |req|
    req.ip if req.path == '/auth/sign_in' && req.post?
  end

  # Rate limit sign-ups
  throttle('register', limit: 10, period: 5.minutes) do |req|
    req.ip if req.path == '/auth' && req.post?
  end

  # Rate limit forgotten passwords
  throttle('reminder', limit: LIMIT, period: PERIOD) do |req|
    req.ip if req.path == '/auth/password' && req.post?
  end

  self.throttled_response = lambda do |env|
    if env.dig('rack.attack.throttle_data', 'register')
      req = ActionDispatch::Request.new(env)
      self.push_temporary_blacklist(req.remote_ip)
    end

    now        = Time.now.utc
    match_data = env['rack.attack.match_data']

    headers = {
      'Content-Type'          => 'application/json',
      'X-RateLimit-Limit'     => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset'     => (now + (match_data[:period] - now.to_i % match_data[:period])).iso8601(6),
    }

    [429, headers, [{ error: I18n.t('errors.429') }.to_json]]
  end
end
