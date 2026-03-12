class RefreshStocksJob < ApplicationJob
  queue_as :default

  def perform(force: false)
    unless force || MarketHoursService.market_open?
      Rails.logger.info "RefreshStocksJob: Market is closed, skipping refresh"
      return
    end

    result = FinancialDataService.refresh_stocks
    Rails.logger.info "RefreshStocksJob: Updated #{result[:updated]} stocks, #{result[:errors].size} errors"
    Rails.logger.warn "RefreshStocksJob: Failed symbols: #{result[:errors].join(', ')}" if result[:errors].any?

    publish_portfolio_updates
  end

  private

  def publish_portfolio_updates
    User.where.not(portfolio_slug: nil).includes(holdings: :stock).find_each do |user|
      NatsPublisher.publish("portfolio.updated", {
        slug: user.portfolio_slug,
        holdings: user.holdings.map { |h|
          { symbol: h.stock.symbol, quantity: h.quantity.to_f, avg_price: h.average_price.to_f, price: (h.stock.price || 0).to_f }
        }
      })
    end
  end
end
