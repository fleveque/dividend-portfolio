module FinancialDataProviders
  class YahooFinanceProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = YahooFinanceClient::Stock.get_quote(symbol)
      {
        symbol: data[:symbol],
        price: data[:price]
      }
    end
  end
end
