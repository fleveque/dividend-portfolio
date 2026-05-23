module AiProviders
  class BaseProvider
    class AiError < StandardError; end

    # Short identifier used for logging / analytics (e.g. on AiRequest rows).
    # Each subclass must override.
    def name
      raise NotImplementedError, "Subclasses must implement #name"
    end

    # Generate insights for a radar's stock portfolio
    #
    # @param stocks_data [Array<Hash>] array of stock data hashes
    # @param locale [String, nil] language locale (e.g., "en", "es")
    # @return [Hash] structured insights
    def radar_insights(stocks_data, locale: nil, preferred_currency: nil)
      raise NotImplementedError, "Subclasses must implement radar_insights"
    end

    # Generate insights for a user's portfolio holdings
    #
    # @param stocks_data [Array<Hash>] array of stock data hashes
    # @param locale [String, nil] language locale (e.g., "en", "es")
    # @return [Hash] structured insights
    def portfolio_insights(stocks_data, locale: nil, preferred_currency: nil)
      raise NotImplementedError, "Subclasses must implement portfolio_insights"
    end

    # Generate a summary for a single stock
    #
    # @param stock_data [Hash] stock data hash
    # @param locale [String, nil] language locale (e.g., "en", "es")
    # @return [Hash] structured summary with verdict
    def stock_summary(stock_data, locale: nil, preferred_currency: nil)
      raise NotImplementedError, "Subclasses must implement stock_summary"
    end

    # Generate a social-media post for X and LinkedIn from a content topic.
    #
    # @param topic [Hash] { category:, topic_key:, inputs: {…} }
    # @param locale [String, nil] language locale (e.g., "en", "es")
    # @return [Hash] { headline:, x: { text: }, linkedin: { text: }, hashtags: [...] }
    def social_post(topic, locale: nil)
      raise NotImplementedError, "Subclasses must implement social_post"
    end

    private

    def cache_fetch(key, expires_in: 6.hours, &block)
      Rails.cache.fetch(key, expires_in: expires_in, &block)
    end
  end
end
