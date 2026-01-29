module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
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
    rescue StandardError => e
      Rails.logger.error "Yahoo Finance API error: #{e.message}"
      nil
    end
  end
end
