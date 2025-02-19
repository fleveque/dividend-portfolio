module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    def self.get_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
      normalize_stock_data(data)
    end

    def self.normalize_stock_data(data)
      # return an example hash for now, as YahooFinanceClient is not working now
      super(
        symbol: "EXAMPLE",
        price: "123.45",
        name: "Example Inc."
      )
    end
  end
end
