# frozen_string_literal: true

Raven.configure do |config|
  config.dsn = ENV['PAWOO_SENTRY_RAILS']

  # Sentry通知を有効にしたいRAILS_ENV
  config.environments = %w[production]

  config.async = ->(event) {
    Thread.new { Raven.send_event(event) }
  }

  # Sentryに送信したくないエラー
  config.excluded_exceptions += %w[
    ActionController::InvalidAuthenticityToken
    ActionController::BadRequest
    ActionController::UnknownFormat
    ActionController::ParameterMissing
    ActiveRecord::RecordNotUnique
    Mastodon::UnexpectedResponseError
    Mastodon::RaceConditionError
    Mastodon::HostValidationError
  ]

  network_exceptions = %w[
    HTTP::StateError
    HTTP::TimeoutError
    HTTP::ConnectionError
    HTTP::Redirector::TooManyRedirectsError
    HTTP::Redirector::EndlessRedirectError
    OpenSSL::SSL::SSLError
    Stoplight::Error::RedLight
    Net::ReadTimeout
  ].freeze

  def ignore_by_sidekiq(exception_name, network_exceptions)
    sidekiq = Raven::Context.current.extra.dig(:sidekiq)
    return false unless sidekiq

    network_workers = %w[
      LinkCrawlWorker
      ProcessingWorker
      ThreadResolveWorker
      NotificationWorker
      Import::RelationshipWorker
      Web::PushNotificationWorker
    ].freeze

    ignore_worker_errors = {
      'ActivityPub::ProcessingWorker' => ['ActiveRecord::RecordInvalid'],
      'LinkCrawlWorker' => ['ActiveRecord::RecordInvalid'],
    }.freeze

    ignore_job_errors = {
      'ActionMailer::DeliveryJob' => ['ActiveJob::DeserializationError']
    }.freeze

    worker_class = sidekiq.dig('class')
    return true if ignore_worker_errors[worker_class]&.include?(exception_name)

    # ActivityPub or Pubsubhubbub or 通信が頻繁に発生するWorkerではネットワーク系の例外を無視
    if worker_class.start_with?('ActivityPub::') || worker_class.start_with?('Pubsubhubbub::') || network_workers.include?(worker_class)
      return true if network_exceptions.include?(exception_name)
    end

    # ActiveJob
    if worker_class == 'ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper'
      return true if ignore_job_errors[sidekiq.dig('wrapped')]&.include?(exception_name)
    end

    false
  end

  def ignore_by_controller(exception_name, network_exceptions)
    controller_class = Raven::Context.current.rack_env&.dig('action_controller.instance')&.class
    return false unless controller_class

    network_controllers_or_concerns = %w[
      RemoteFollowController
      SignatureVerification
    ].freeze

    ignore_controller_errors = {
      'MediaProxyController' => ['ActiveRecord::RecordInvalid'],
    }.freeze

    return true if ignore_controller_errors[controller_class.name]&.include?(exception_name)

    # SignatureVerificationがincludeされているコントローラ or 通信が頻繁に発生するコントローラではネットワーク系のエラーを無視
    if controller_class.ancestors.any? { |klass| network_controllers_or_concerns.include?(klass.name) }
      return true if network_exceptions.include?(exception_name)
    end

    false
  end

  config.should_capture = ->(message_or_exc) do
    return true unless message_or_exc.is_a? Exception

    exception_name = message_or_exc.class.name

    # includes invalid characters
    return false if exception_name == 'ActiveRecord::RecordInvalid' && exception.message.end_with?('includes invalid characters')
    return false if ignore_by_sidekiq(exception_name, network_exceptions)
    return false if ignore_by_controller(exception_name, network_exceptions)

    true
  end
end
