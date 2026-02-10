module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
      normalize_yahoo_data(data)
    rescue StandardError => e
      Rails.logger.error "Yahoo Finance API error: #{e.message}"
      nil
    end

    def fetch_and_normalize_stocks(symbols)
      quotes = YahooFinanceClient::Stock.get_quotes(symbols)
      symbols.index_with { |symbol| normalize_yahoo_data(quotes[symbol]) }
    rescue StandardError => e
      Rails.logger.error "Yahoo Finance bulk API error: #{e.message}"
      super
    end

    def normalize_yahoo_data(data)
      return nil unless data && data[:symbol].present? && data[:price].present?

      {
        symbol: data[:symbol],
        price: data[:price],
        name: data[:name],
        eps: data[:eps],
        pe_ratio: data[:pe_ratio],
        dividend: data[:dividend],
        dividend_yield: data[:dividend_yield],
        payout_ratio: data[:payout_ratio],
        ma_50: data[:ma50],
        ma_200: data[:ma200]
      }
    end
  end
end
