module FinancialDataProviders
  class AlphaVantageProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = Alphavantage::TimeSeries.new(symbol: symbol).quote
      return nil unless data && data.symbol.present? && data.price.present?

      {
        symbol: data.symbol,
        price: data.price
      }
    rescue StandardError => e
      Rails.logger.error "AlphaVantage API error: #{e.message}"
      nil
    end
  end
end
