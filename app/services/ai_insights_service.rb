class AiInsightsService
  class << self
    def radar_insights(stocks_data, locale: nil, preferred_currency: nil)
      provider.radar_insights(stocks_data, locale: locale, preferred_currency: preferred_currency)
    end

    def portfolio_insights(stocks_data, locale: nil, preferred_currency: nil)
      provider.portfolio_insights(stocks_data, locale: locale, preferred_currency: preferred_currency)
    end

    def stock_summary(stock_data, locale: nil, preferred_currency: nil)
      provider.stock_summary(stock_data, locale: locale, preferred_currency: preferred_currency)
    end

    private

    def provider
      @provider ||= AiProviders::GeminiProvider.new
    end
  end
end
