module FinancialDataProviders
  class AlphaVantageProvider < BaseProvider
    RATE_LIMIT_DELAY = 25
    AV_BASE_URL = "https://www.alphavantage.co/query"

    private

    def fetch_and_normalize_stock(symbol)
      quote_data = Alphavantage::TimeSeries.new(symbol: symbol).quote
      return nil unless quote_data && quote_data.symbol.present? && quote_data.price.present?

      overview = fetch_overview(symbol)
      data = build_stock_data(quote_data, overview)

      enrich_with_dividend_schedule(data, symbol)
    rescue StandardError => e
      Rails.logger.error "AlphaVantage API error: #{e.message}"
      nil
    end

    def fetch_and_normalize_stocks(symbols)
      total = symbols.size
      symbols.each_with_object({}).with_index do |(symbol, results), index|
        Rails.logger.info "Refreshing stock #{index + 1}/#{total}: #{symbol}"
        results[symbol] = fetch_and_normalize_stock(symbol)
        sleep(RATE_LIMIT_DELAY) if index < total - 1
      end
    end

    def build_stock_data(quote_data, overview)
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
        ma_200: parse_decimal(overview&.dig("200DayMovingAverage")),
        ex_dividend_date: parse_date(overview&.dig("ExDividendDate"))
      }
    end

    def enrich_with_dividend_schedule(data, symbol)
      history = fetch_dividend_history(symbol)
      schedule = infer_dividend_schedule(history)

      if schedule.present?
        data.merge(schedule)
      elsif data[:dividend]&.positive?
        data.merge(payment_frequency: "quarterly", payment_months: [])
      else
        data
      end
    end

    def fetch_dividend_history(symbol)
      api_key = ENV["ALPHAVANTAGE_API_KEY"]
      return [] if api_key.blank?

      response = HTTParty.get(AV_BASE_URL, query: {
        function: "DIVIDENDS", symbol: symbol, apikey: api_key
      })
      parse_av_dividend_history(response.body)
    rescue StandardError => e
      Rails.logger.warn "AlphaVantage dividend history error for #{symbol}: #{e.message}"
      []
    end

    # AV DIVIDENDS CSV columns: ex_dividend_date,declaration_date,record_date,payment_date,amount
    def parse_av_dividend_history(csv_body)
      lines = csv_body.to_s.lines.drop(1) # skip header
      lines.filter_map do |line|
        fields = line.strip.split(",")
        next if fields.size < 5

        date = parse_date(fields[0])
        amount = fields[4].to_f
        next unless date && amount.positive?

        { date: date, amount: amount.round(4) }
      end.sort_by { |d| d[:date] }
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

    def parse_date(value)
      return nil if value.blank? || value == "None" || value == "-"
      Date.parse(value)
    rescue Date::Error
      nil
    end
  end
end
