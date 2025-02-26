module FinancialDataProviders
  class BaseProvider
    REQUIRED_FIELDS = [ :symbol, :price ].freeze
    OPTIONAL_FIELDS = [ :name ].freeze

    # Fetches stock data from the provider's API, stores it in the database and caches the result.
    #
    # @param symbol [String] the stock symbol
    # @return [Stock] the stock instance
    def get_stock(symbol)
      cached_data = Rails.cache.fetch("stock/#{symbol}", expires_in: 1.hour) do
        # This block only executes on cache miss
        data = fetch_and_normalize_stock(symbol)
        return nil unless data

        store_stock_data(data).to_json
      end

      # Convert cached JSON back to Stock instance
      parsed_data = JSON.parse(cached_data)
      stock = Stock.find_or_initialize_by(symbol: parsed_data["symbol"])
      stock.assign_attributes(parsed_data)
      stock
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
