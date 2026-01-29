module FinancialDataProviders
  class AlphaVantageProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      quote_data = Alphavantage::TimeSeries.new(symbol: symbol).quote
      return nil unless quote_data && quote_data.symbol.present? && quote_data.price.present?

      # Fetch additional metrics from company overview
      overview = fetch_overview(symbol)

      {
        symbol: quote_data.symbol,
        price: quote_data.price,
        name: overview&.dig("Name"),
        eps: parse_decimal(overview&.dig("EPS")),
        pe_ratio: parse_decimal(overview&.dig("PERatio")),
        dividend: parse_decimal(overview&.dig("DividendPerShare")),
        dividend_yield: parse_decimal(overview&.dig("DividendYield")),
        payout_ratio: parse_decimal(overview&.dig("PayoutRatio")),
        ma_50: parse_decimal(overview&.dig("50DayMovingAverage")),
        ma_200: parse_decimal(overview&.dig("200DayMovingAverage"))
      }
    rescue StandardError => e
      Rails.logger.error "AlphaVantage API error: #{e.message}"
      nil
    end

    def fetch_overview(symbol)
      Alphavantage::Fundamental.new(symbol: symbol).overview
    rescue StandardError => e
      Rails.logger.warn "AlphaVantage overview API error for #{symbol}: #{e.message}"
      nil
    end

    def parse_decimal(value)
      return nil if value.blank? || value == "None" || value == "-"
      BigDecimal(value.to_s)
    rescue ArgumentError
      nil
    end
  end
end
