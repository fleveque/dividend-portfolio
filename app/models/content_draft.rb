class ContentDraft < ApplicationRecord
  TOPIC_TYPES = %w[stock_of_the_day dividend_calendar pulse_aggregates feature_announcement].freeze

  validates :topic_type, presence: true, inclusion: { in: TOPIC_TYPES }
  validates :topic_key, presence: true
  validates :payload, presence: true
  validates :generated_at, presence: true

  scope :recent, ->(limit = 30) { order(generated_at: :desc).limit(limit) }

  # Returns the set of topic_keys used by `topic_type` within the lookback window.
  # Used by TopicSelector to dedupe — e.g. don't pick "stock_of_the_day: REP.MC" twice in 14 days.
  def self.recent_keys(topic_type, days:)
    where(topic_type: topic_type)
      .where("generated_at > ?", days.days.ago)
      .pluck(:topic_key)
      .to_set
  end

  # The most-recently-used topic_type within the lookback window — used to enforce
  # "don't repeat the same category two days in a row" in auto-pick.
  def self.recent_topic_types(days:)
    where("generated_at > ?", days.days.ago)
      .order(generated_at: :desc)
      .pluck(:topic_type)
      .uniq
  end
end
