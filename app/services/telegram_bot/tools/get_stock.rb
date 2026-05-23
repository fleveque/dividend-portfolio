module TelegramBot
  module Tools
    # Single-stock lookup by ticker. Returns nil-marker if the symbol isn't in
    # our DB — the LLM can then tell the user we don't have it tracked.
    class GetStock
      def self.call(symbol:)
        stock = Stock.find_by("UPPER(symbol) = ?", symbol.to_s.upcase)
        return { found: false, symbol: symbol } if stock.nil?

        decorated = StockDecorator.new(stock)
        {
          found: true,
          symbol: stock.symbol,
          name: stock.name,
          currency: stock.currency,
          price: stock.price&.to_f,
          dividend_yield: stock.dividend_yield&.to_f,
          annual_dividend: stock.dividend&.to_f,
          dividend_score: decorated.dividend_score,
          payment_frequency: stock.payment_frequency,
          ex_dividend_date: stock.ex_dividend_date&.iso8601,
          sector: stock.sector,
          pe_ratio: stock.pe_ratio&.to_f,
          payout_ratio: stock.payout_ratio&.to_f
        }
      end
    end
  end
end
