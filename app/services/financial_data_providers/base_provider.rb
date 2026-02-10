module FinancialDataProviders
  class BaseProvider
    REQUIRED_FIELDS = [ :symbol, :price ].freeze
    OPTIONAL_FIELDS = [
      :name, :eps, :pe_ratio, :dividend, :dividend_yield,
      :payout_ratio, :ma_50, :ma_200
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

    def normalize_stock_data(data)
      normalized = REQUIRED_FIELDS.each_with_object({}) do |field, hash|
        value = data[field] || data.try(field)
        raise ArgumentError, "Missing required field: #{field}" if value.nil?

        hash[field] = value
      end

      OPTIONAL_FIELDS.each_with_object(normalized) do |field, hash|
        value = data[field] || data.try(field)
        hash[field] = value if value.present?
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
