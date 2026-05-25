module TelegramBot
  module Tools
    # Returns a compact LLM-friendly representation of the user's radar.
    # Shape is intentionally short: ticker + currency + price + target +
    # status. The LLM does the prose part.
    class GetRadar
      def self.call(user:)
        radar = user.radar
        return { stocks: [], note: "No radar yet." } if radar.nil?

        stocks = radar.sorted_stocks || []
        return { stocks: [] } if stocks.empty?

        {
          stocks: stocks.map { |stock| serialize(stock, radar) }
        }
      end

      def self.serialize(stock, radar)
        target = radar.radar_stocks.find { |rs| rs.stock_id == stock.id }&.target_price
        status = compute_status(stock.price, target)
        decorated = StockDecorator.new(stock)
        {
          symbol: stock.symbol,
          name: stock.name,
          currency: stock.currency,
          price: stock.price&.to_f,
          target_price: target&.to_f,
          status: status,
          dividend_yield: stock.dividend_yield&.to_f,
          payout_ratio: stock.payout_ratio&.to_f,
          pe_ratio: stock.pe_ratio&.to_f,
          # Valuation context — lets the LLM answer "near 52w low",
          # "above MA200", "below midpoint" without a dedicated tool.
          fifty_two_week_high: stock.fifty_two_week_high&.to_f,
          fifty_two_week_low: stock.fifty_two_week_low&.to_f,
          fifty_two_week_range_position: decorated.fifty_two_week_range_position,
          ma_50: stock.ma_50&.to_f,
          ma_200: stock.ma_200&.to_f,
          sector: stock.sector
        }
      end

      def self.compute_status(price, target)
        return nil if price.nil? || target.nil?
        return "below_target" if price.to_f < target.to_f
        return "above_target" if price.to_f > target.to_f
        "at_target"
      end
    end
  end
end
