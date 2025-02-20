module FinancialDataProviders
  class BaseProvider
    def self.get_stock(symbol)
      raise NotImplementedError, "Subclasses must implement the get_stock method"
    end

    def self.normalize_stock_data(symbol:, price:)
      {
        symbol:,
        price:
      }
    end
  end
end
