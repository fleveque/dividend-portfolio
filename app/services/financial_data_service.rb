class FinancialDataService
  class << self
    def get_stock(symbol)
      provider.get_stock(symbol)
    end

    private

    def provider
      @provider ||= begin
        provider_name = Rails.application.config.financial_data_provider
        provider_class = "FinancialDataProviders::#{provider_name.to_s.classify}Provider".constantize
        provider_class.new
      rescue StandardError
        raise "Provider not found: #{provider_name}. " \
        "Ensure the provider class exists in the FinancialDataProviders module"
      end
    end
  end
end
