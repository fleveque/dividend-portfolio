module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
      return nil unless data && data[:symbol].present? && data[:price].present?

      {
        symbol: data[:symbol],
        price: data[:price]
      }
    rescue StandardError => e
      Rails.logger.error "Yahoo Finance API error: #{e.message}"
      nil
    end
  end
end
