class FinancialDataService
  def self.get_stock(symbol)
    case Rails.application.config.financial_data_provider
    when :yahoo_finance_client
      FinancialDataProviders::YahooFinanceProvider.get_stock(symbol)
    else
      raise "Unknown financial data provider: #{Rails.application.config.financial_data_provider}"
    end
  end
end
