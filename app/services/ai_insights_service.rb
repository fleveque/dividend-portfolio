class AiInsightsService
  class << self
    def radar_insights(stocks_data, locale: nil)
      provider.radar_insights(stocks_data, locale: locale)
    end

    def portfolio_insights(stocks_data, locale: nil)
      provider.portfolio_insights(stocks_data, locale: locale)
    end

    def stock_summary(stock_data, locale: nil)
      provider.stock_summary(stock_data, locale: locale)
    end

    private

    def provider
      @provider ||= AiProviders::GeminiProvider.new
    end
  end
end
