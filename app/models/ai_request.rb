# Log of actual LLM calls (cache hits are *not* recorded). Powers the per-user
# daily rate limit (`AiRateLimiter`) and gives us a paper trail for cost
# attribution per user / feature / provider.
class AiRequest < ApplicationRecord
  belongs_to :user

  # Feature keys must match the ones AiRateLimiter / AiInsightsService pass in.
  # Adding a new AI-using feature? Register its key here so the values stay
  # discoverable from one place.
  FEATURES = %w[
    radar_insights
    portfolio_insights
    stock_summary
    social_post
    telegram_chat
  ].freeze

  validates :feature, inclusion: { in: FEATURES }
  validates :provider, presence: true

  scope :today_for, ->(user) {
    where(user: user).where("created_at >= ?", Time.current.utc.beginning_of_day)
  }
end
