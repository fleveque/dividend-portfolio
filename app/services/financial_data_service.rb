class FinancialDataService
  def self.get_stock(symbol)
    provider_name = Rails.application.config.financial_data_provider
    provider_class = "FinancialDataProviders::#{provider_name.to_s.classify}Provider".constantize

    provider_class.get_stock(symbol)
  rescue NameError
    raise "Provider not found: #{provider_name}. Ensure the provider class exists in the FinancialDataProviders module"
  end
end
