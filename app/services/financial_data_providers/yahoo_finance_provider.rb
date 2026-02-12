module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
      normalized = normalize_yahoo_data(data)
      return nil unless normalized

      enrich_with_dividend_schedule(normalized, symbol)
    rescue StandardError => e
      Rails.logger.error "Yahoo Finance API error: #{e.message}"
      nil
    end

    def fetch_and_normalize_stocks(symbols)
      quotes = YahooFinanceClient::Stock.get_quotes(symbols)
      symbols.index_with do |symbol|
        normalized = normalize_yahoo_data(quotes[symbol])
        next nil unless normalized

        enrich_with_dividend_schedule(normalized, symbol)
      end
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
        ma_200: data[:ma200],
        ex_dividend_date: data[:ex_dividend_date] || data[:dividend_date]
      }
    end

    def enrich_with_dividend_schedule(data, symbol)
      history = fetch_dividend_history(symbol)
      schedule = infer_dividend_schedule(history)

      if schedule.present?
        data.merge(schedule)
      elsif data[:dividend].present?
        data.merge(payment_frequency: "quarterly", payment_months: [])
      else
        data
      end
    end

    def fetch_dividend_history(symbol)
      YahooFinanceClient::Stock.get_dividend_history(symbol)
    rescue StandardError => e
      Rails.logger.warn "Yahoo Finance dividend history error for #{symbol}: #{e.message}"
      []
    end
  end
end
