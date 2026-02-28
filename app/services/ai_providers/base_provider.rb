module AiProviders
  class BaseProvider
    class AiError < StandardError; end

    # Generate insights for a radar's stock portfolio
    #
    # @param stocks_data [Array<Hash>] array of stock data hashes
    # @return [Hash] structured insights
    def radar_insights(stocks_data)
      raise NotImplementedError, "Subclasses must implement radar_insights"
    end

    # Generate a summary for a single stock
    #
    # @param stock_data [Hash] stock data hash
    # @return [Hash] structured summary with verdict
    def stock_summary(stock_data)
      raise NotImplementedError, "Subclasses must implement stock_summary"
    end

    private

    def cache_fetch(key, expires_in: 6.hours, &block)
      Rails.cache.fetch(key, expires_in: expires_in, &block)
    end
  end
end
