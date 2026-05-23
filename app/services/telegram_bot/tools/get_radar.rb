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
        {
          symbol: stock.symbol,
          name: stock.name,
          currency: stock.currency,
          price: stock.price&.to_f,
          target_price: target&.to_f,
          status: status,
          dividend_yield: stock.dividend_yield&.to_f,
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
