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
  end
end
