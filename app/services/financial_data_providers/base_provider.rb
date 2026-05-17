module FinancialDataProviders
  class BaseProvider
    REQUIRED_FIELDS = [ :symbol, :price ].freeze
    OPTIONAL_FIELDS = [
      :name, :currency, :sector, :industry, :eps, :pe_ratio, :dividend, :dividend_yield,
      :payout_ratio, :ma_50, :ma_200, :fifty_two_week_high, :fifty_two_week_low,
      :ex_dividend_date, :payment_frequency, :payment_months, :shifted_payment_months
    ].freeze
    SEARCH_RESULT_LIMIT = 10
    SEARCH_CACHE_TTL = 6.hours
    # Provider search returns many quote types (currency, future, index, crypto, …) that
    # don't fit a dividend-tracking app. Allowlist what we actually want; matched
    # case-insensitively against the provider's type. MUTUALFUND is in because Spanish
    # dividend funds like Baelo Dividendo Creciente are mutual funds, not ETFs.
    SEARCHABLE_TYPES = %w[EQUITY ETF MUTUALFUND].freeze
    # Some exchanges quote in the minor unit of the currency (London uses pence,
    # Johannesburg uses cents, Tel Aviv uses agorot). Yahoo returns these as
    # lowercased-suffix codes; we normalize to the major unit at ingest so the
    # rest of the system only ever deals with whole-unit amounts.
    MINOR_UNIT_CURRENCIES = {
      "GBp" => [ "GBP", 100 ], "ZAc" => [ "ZAR", 100 ], "ILA" => [ "ILS", 100 ]
    }.freeze
    # Yahoo returns the price-family fields (regularMarketPrice and its moving averages /
    # 52-week range) in the listing's quote unit (GBp for DGE.L, etc.), but `dividendRate`
    # and `epsTrailingTwelveMonths` already come back in the major unit (GBP). Don't
    # normalize them or we'd shrink a £0.81 dividend to £0.0081.
    PRICE_FIELDS = %i[price ma_50 ma_200 fifty_two_week_high fifty_two_week_low].freeze

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

    # Searches local Stock rows and the provider's autocomplete index, merging results.
    # Returns lightweight result hashes — no provider calls per result, so it works under
    # rate-limited providers (Alpha Vantage).
    #
    # @param query [String] free-text query (ticker or company name)
    # @return [Array<Hash>] each entry: { symbol:, name:, exchange:, type:, stock_id:, in_db: }
    def search(query)
      normalized = query.to_s.strip
      return [] if normalized.empty?

      Rails.cache.fetch(search_cache_key(normalized), expires_in: SEARCH_CACHE_TTL) do
        db_matches = search_db(normalized)
        provider_matches = filter_searchable(fetch_and_normalize_search(normalized) || [])
        merge_results(db_matches, provider_matches).first(SEARCH_RESULT_LIMIT)
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

    # Provider-specific autocomplete lookup. Subclasses return a list of hashes shaped like
    # { symbol:, name:, exchange:, type: } and may rescue upstream errors to [].
    def fetch_and_normalize_search(query)
      raise NotImplementedError, "Subclasses must implement fetch_and_normalize_search"
    end

    def search_cache_key(normalized)
      "stock_search/#{self.class.name.demodulize}/#{Digest::MD5.hexdigest(normalized.downcase)}"
    end

    def filter_searchable(matches)
      matches.select { |m| SEARCHABLE_TYPES.include?(m[:type].to_s.upcase) }
    end

    # SQLite LIKE is case-insensitive for ASCII so we downcase both sides.
    def search_db(query)
      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query.downcase)}%"
      Stock.where("LOWER(symbol) LIKE ? OR LOWER(name) LIKE ?", pattern, pattern)
           .limit(SEARCH_RESULT_LIMIT)
           .map { |s| db_match(s) }
    end

    def db_match(stock)
      { symbol: stock.symbol, name: stock.name, exchange: nil, type: "EQUITY",
        stock_id: stock.id, in_db: true }
    end

    # DB rows take precedence over provider rows when symbols collide — they carry the
    # real Stock id so the Add flow can skip the resolve call. But the DB doesn't
    # store exchange/type, so we backfill those from the provider row when we have
    # one (otherwise a search of any held stock loses its "London"/"NasdaqGS" badge).
    def merge_results(db_matches, provider_matches)
      provider_by_symbol = provider_matches.each_with_object({}) do |m, h|
        h[m[:symbol]] = m unless m[:symbol].nil?
      end
      by_symbol = {}
      db_matches.each do |m|
        provider_meta = provider_by_symbol[m[:symbol]] || {}
        by_symbol[m[:symbol]] ||= m.merge(
          exchange: m[:exchange] || provider_meta[:exchange],
          type: m[:type] || provider_meta[:type]
        )
      end
      provider_matches.each do |m|
        next if m[:symbol].nil? || by_symbol.key?(m[:symbol])

        by_symbol[m[:symbol]] = m.merge(stock_id: nil, in_db: false)
      end
      by_symbol.values
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
      normalized_data = normalize_minor_unit_currency(normalize_stock_data(data))
      stock = Stock.find_or_initialize_by(symbol: normalized_data[:symbol])
      stock.update!(normalized_data.merge(updated_at: Time.current))
      stock
    end

    # GBp/ZAc/ILA → divide every monetary field by 100, swap to the major-unit code.
    # Yield/payout/PE are ratios so they're left alone.
    def normalize_minor_unit_currency(data)
      conversion = MINOR_UNIT_CURRENCIES[data[:currency]]
      return data unless conversion

      major_code, divisor = conversion
      PRICE_FIELDS.each { |field| data[field] = data[field] / divisor.to_f if data[field] }
      data[:currency] = major_code
      data
    end
  end
end
