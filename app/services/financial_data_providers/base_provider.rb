module FinancialDataProviders
  class BaseProvider
    REQUIRED_FIELDS = [ :symbol, :price ].freeze
    OPTIONAL_FIELDS = [
      :name, :eps, :pe_ratio, :dividend, :dividend_yield,
      :payout_ratio, :ma_50, :ma_200, :ex_dividend_date, :payment_frequency,
      :payment_months, :shifted_payment_months
    ].freeze

    # Fetches stock data from the provider's API, stores it in the database and caches the result.
    #
    # @param symbol [String] the stock symbol
    # @return [Stock] the stock instance
    def get_stock(symbol)
      normalized_symbol = symbol.upcase.strip

      Rails.cache.fetch("stock/#{normalized_symbol}", expires_in: 1.hour) do
        data = fetch_and_normalize_stock(normalized_symbol)
        return nil unless data

        store_stock_data(data)
      end
    end

    # Refreshes all stocks in the database with the latest data from the provider.
    #
    # @return [Hash] { updated: Integer, errors: Array<String> }
    def refresh_stocks
      symbols = Stock.pluck(:symbol).map { |s| s.upcase.strip }
      return { updated: 0, errors: [] } if symbols.empty?

      results = fetch_and_normalize_stocks(symbols)
      updated = 0
      errors = []

      symbols.each do |symbol|
        data = results[symbol]
        if data && data[:error].nil?
          stock = store_stock_data(data)
          Rails.cache.write("stock/#{symbol}", stock, expires_in: 1.hour)
          updated += 1
        else
          errors << symbol
        end
      rescue StandardError => e
        Rails.logger.error("Failed to refresh stock #{symbol}: #{e.message}")
        errors << symbol
      end

      { updated: updated, errors: errors }
    end

    private

    # This method should be implemented by subclasses.
    #
    # @param symbol [String] the stock symbol
    # @return [Hash] the stock data
    def fetch_and_normalize_stock(symbol)
      raise NotImplementedError, "Subclasses must implement the fetch_and_normalize_stock method " \
      "and be added to config/initializers/financial_data_provider.rb initializer."
    end

    # Default sequential fallback. Subclasses can override for bulk fetching.
    def fetch_and_normalize_stocks(symbols)
      symbols.each_with_object({}) do |symbol, results|
        results[symbol] = fetch_and_normalize_stock(symbol)
      end
    end

    # Infers payment_frequency and payment_months from a dividend history array.
    # Each entry should be { date: Date, amount: Float }.
    # Returns { payment_frequency:, payment_months: } or empty hash if insufficient data.
    def infer_dividend_schedule(history)
      return {} if history.blank?

      annual_count = estimate_annual_count(history)
      frequency = frequency_from_count(annual_count)
      month_counts = history.map { |d| d[:date].month }.tally
      primary, shifted = classify_months(month_counts)

      # Monthly payers hit all 12 months — boundary timing doesn't mean a shift
      if frequency == "monthly"
        primary += shifted
        shifted = []
      end

      {
        payment_frequency: frequency,
        payment_months: (primary + shifted).uniq.sort,
        shifted_payment_months: shifted.sort
      }
    end

    # Months appearing only once in multi-year data are "shifted" — the payment
    # occasionally lands there instead of the adjacent primary month.
    # With only 1 year of data (max count = 1), we can't detect shifts.
    def classify_months(month_counts)
      max_count = month_counts.values.max || 0
      threshold = max_count > 1 ? 2 : 1

      primary = []
      shifted = []
      month_counts.each do |month, count|
        (count >= threshold ? primary : shifted) << month
      end
      [ primary, shifted ]
    end

    def estimate_annual_count(history)
      return history.size.to_f if history.size <= 1

      dates = history.map { |d| d[:date] }
      span_days = (dates.last - dates.first).to_f
      return history.size.to_f if span_days < 90

      avg_interval = span_days / (history.size - 1)
      (365.25 / avg_interval).round(1)
    end

    def frequency_from_count(annual_count)
      case annual_count
      when 10..Float::INFINITY then "monthly"
      when 3..9 then "quarterly"
      when 1.5..2.9 then "semi_annual"
      else "annual"
      end
    end

    def normalize_stock_data(data)
      normalized = REQUIRED_FIELDS.each_with_object({}) do |field, hash|
        value = data[field] || data.try(field)
        raise ArgumentError, "Missing required field: #{field}" if value.nil?

        hash[field] = value
      end

      OPTIONAL_FIELDS.each_with_object(normalized) do |field, hash|
        value = data[field] || data.try(field)
        hash[field] = value if !value.nil? && (value.is_a?(Array) || value.present?)
      end
    end

    def store_stock_data(data)
      normalized_data = normalize_stock_data(data)
      stock = Stock.find_or_initialize_by(symbol: normalized_data[:symbol])
      stock.update!(normalized_data.merge(updated_at: Time.current))
      stock
    end
  end
end
