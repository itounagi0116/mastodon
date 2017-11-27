# frozen_string_literal: true

class FeedInsertWorker
  include Sidekiq::Worker

  attr_reader :status, :followers

  def perform(status_id, follower_ids)
    @status = Status.find_by(id: status_id)
    @followers = Account.where(id: follower_ids)

    check_and_insert
  end

  private

  def check_and_insert
    if records_available?
      # TODO: reduce N+1 queries to filter followers
      @followers = followers.reject { |follower| feed_filtered?(follower) }

      perform_push if followers.present?
    else
      true
    end
  end

  def records_available?
    status.present? && followers.present?
  end

  def feed_filtered?(follower)
    FeedManager.instance.filter?(:home, status, follower.id)
  end

  def perform_push
    FeedManager.instance.push(:home, followers, status)
  end
end
