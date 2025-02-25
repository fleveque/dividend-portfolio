module FinancialDataProviders
  class AlphaVantageProvider < BaseProvider
    private

    def fetch_and_normalize_stock(symbol)
      data = Alphavantage::TimeSeries.new(symbol: symbol).quote
      {
        symbol: data.symbol,
        price: data.price
      }
    end
  end
end
