module FinancialDataProvider
  SUPPORTED_PROVIDERS = {
    alpha_vantage: {
      gem: "alphavantage",
      config: ->(config) {
        Alphavantage.configure do |c|
          c.api_key = ENV["ALPHAVANTAGE_API_KEY"]
        end
      }
    },
    yahoo_finance: {
      gem: "yahoo_finance_client",
      config: ->(config) {
        # Add Yahoo Finance specific configuration if needed
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
