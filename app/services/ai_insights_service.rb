class AiInsightsService
  class << self
    def radar_insights(stocks_data)
      provider.radar_insights(stocks_data)
    end

    def stock_summary(stock_data)
      provider.stock_summary(stock_data)
    end

    private

    def provider
      @provider ||= AiProviders::GeminiProvider.new
    end
  end
end
