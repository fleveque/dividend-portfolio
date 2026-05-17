module FinancialDataProvider
  SUPPORTED_PROVIDERS = {
    alpha_vantage: {
      gem: "alphavantage",
      config: ->(config) {
        Alphavantage.configure do |c|
          c.api_key = ENV["ALPHAVANTAGE_API_KEY"]
        end
        # Use AV's CURRENCY_EXCHANGE_RATE endpoint for FX so the whole stack
        # speaks the same provider when AV is the active stock source.
        config.fx_rate_provider = FinancialDataProviders::AlphaVantageFxProvider
      }
    },
    yahoo_finance: {
      gem: "yahoo_finance_client",
      config: ->(config) {
        # FxRateService falls back to YahooFinanceClient::Stock when no
        # `fx_rate_provider` is configured — nothing to set here.
      }
    }
  }.freeze

  def self.configure
    provider = Rails.application.config.financial_data_provider
    provider_config = SUPPORTED_PROVIDERS[provider]

    unless provider_config
      raise "Unsupported financial data provider: #{provider}. " \
            "Supported providers are: #{SUPPORTED_PROVIDERS.keys.join(", ")}"
    end

    unless defined?(provider_config[:gem].classify.constantize)
      raise "#{provider} is configured but #{provider_config[:gem]} gem is not installed. " \
            "Please add \"gem '#{provider_config[:gem]}'\" to your Gemfile"
    end

    provider_config[:config].call(Rails.application.config)
  end
end

# Set the default provider
Rails.application.config.financial_data_provider = :yahoo_finance

# Configure the selected provider
FinancialDataProvider.configure
