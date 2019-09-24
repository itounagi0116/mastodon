# frozen_string_literal: true
require 'sidekiq-scheduler'

class Pawoo::Scheduler::PrepareSitemapScheduler
  include Sidekiq::Worker

  sidekiq_options unique: :until_executed, retry: 0

  def perform
    Pawoo::Sitemap::PrepareStatusesWorker.perform_async(1, SecureRandom.hex)
    Pawoo::Sitemap::PrepareUsersWorker.perform_async(1, SecureRandom.hex)
  end
end
