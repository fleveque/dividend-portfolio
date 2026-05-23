module TelegramBot
  module Tools
    # LLM-friendly portfolio snapshot: holdings with cost/value/PnL plus
    # per-currency totals so the model can answer "how's my portfolio doing"
    # without re-aggregating.
    class GetHoldings
      def self.call(user:)
        holdings = user.holdings.includes(:stock)
        return { holdings: [] } if holdings.empty?

        totals = Hash.new { |h, k| h[k] = { value: 0.0, cost: 0.0 } }
        serialised = holdings.map do |h|
          market = (h.stock.price || 0).to_f * h.quantity.to_f
          cost = h.average_price.to_f * h.quantity.to_f
          totals[h.stock.currency][:value] += market
          totals[h.stock.currency][:cost] += cost
          {
            symbol: h.stock.symbol,
            quantity: h.quantity.to_f,
            average_price: h.average_price.to_f,
            current_price: h.stock.price&.to_f,
            currency: h.stock.currency,
            market_value: market.round(2),
            gain_loss: (market - cost).round(2),
            gain_loss_percent: cost.positive? ? ((market - cost) / cost * 100).round(2) : nil,
            sector: h.stock.sector
          }
        end

        {
          holdings: serialised,
          totals_by_currency: totals.transform_values do |t|
            {
              value: t[:value].round(2),
              cost: t[:cost].round(2),
              gain_loss: (t[:value] - t[:cost]).round(2),
              gain_loss_percent: t[:cost].positive? ? ((t[:value] - t[:cost]) / t[:cost] * 100).round(2) : nil
            }
          end
        }
      end
    end
  end
end
