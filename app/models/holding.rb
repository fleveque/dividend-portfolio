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

  private

  def publish_portfolio_updated
    return unless user.portfolio_slug.present?

    NatsPublisher.publish("portfolio.updated", {
      slug: user.portfolio_slug,
      holdings: user.holdings.includes(:stock).map { |h|
        { symbol: h.stock.symbol, quantity: h.quantity.to_f, avg_price: h.average_price.to_f }
      }
    })
  end
end
