class Holding < ApplicationRecord
  belongs_to :user
  belongs_to :stock

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :average_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :stock_id, uniqueness: { scope: :user_id }

  def self.most_added_stocks(limit = 10)
    Stock.joins(:holdings)
         .group("stocks.id")
         .order("COUNT(holdings.user_id) DESC")
         .limit(limit)
  end

  after_commit :publish_portfolio_updated
  after_commit :invalidate_motivation_cache

  private

  def publish_portfolio_updated
    return unless user.portfolio_slug.present?

    NatsPublisher.publish("portfolio.updated", PortfolioPayloadBuilder.call(user))
  end

  # The cached motivation summary depends on the user's portfolio value
  # and current yield, so any holding change (qty edit, add, delete)
  # invalidates it. Stock price refreshes don't touch holdings, so the
  # 6h TTL absorbs those — accurate enough for a teaser.
  def invalidate_motivation_cache
    MotivationProjectionService.invalidate_cache(user)
  end
end
