module FinancialDataProviders
  class AlphaVantageProvider < BaseProvider
    def self.get_stock(symbol)
      data = Alphavantage::TimeSeries.new(symbol:).quote
      normalize_stock_data(data)
    end

    def self.normalize_stock_data(data)
      super(
        symbol: data.symbol,
        price: data.price
      )
    end
  end
end
