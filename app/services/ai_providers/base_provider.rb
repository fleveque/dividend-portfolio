module AiProviders
  class BaseProvider
    class AiError < StandardError; end

    # Short identifier used for logging / analytics (e.g. on AiRequest rows).
    # Each subclass must override.
    def name
      raise NotImplementedError, "Subclasses must implement #name"
    end

    # Multi-turn chat with optional tool calling. The provider internally
    # resolves up to `max_tool_rounds` rounds: send messages, receive tool
    # calls, invoke them, feed results back, repeat — until the LLM emits
    # plain text. Returns an `AiProviders::ChatResult`.
    #
    # @param messages [Array<Hash>] [{ role: "user"|"assistant", text: "..." }]
    # @param tools [Array<AiProviders::Tool>] tools the LLM may call
    # @param system [String, nil] system instructions
    # @param locale [String, nil] "en" / "es"; provider appends a language
    #                             instruction if non-English
    # @param max_tool_rounds [Integer] hard cap on tool-call iterations
    # @return [AiProviders::ChatResult]
    def chat(messages:, tools: [], system: nil, locale: nil, max_tool_rounds: 3)
      raise NotImplementedError, "Subclasses must implement #chat"
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
