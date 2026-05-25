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
          decorated = StockDecorator.new(h.stock)
          {
            symbol: h.stock.symbol,
            quantity: h.quantity.to_f,
            average_price: h.average_price.to_f,
            current_price: h.stock.price&.to_f,
            currency: h.stock.currency,
            market_value: market.round(2),
            gain_loss: (market - cost).round(2),
            gain_loss_percent: cost.positive? ? ((market - cost) / cost * 100).round(2) : nil,
            dividend_yield: h.stock.dividend_yield&.to_f,
            payout_ratio: h.stock.payout_ratio&.to_f,
            pe_ratio: h.stock.pe_ratio&.to_f,
            # Valuation context — lets the LLM answer "near 52w low" /
            # "above MA200" without us shipping a dedicated tool.
            fifty_two_week_high: h.stock.fifty_two_week_high&.to_f,
            fifty_two_week_low: h.stock.fifty_two_week_low&.to_f,
            fifty_two_week_range_position: decorated.fifty_two_week_range_position,
            ma_50: h.stock.ma_50&.to_f,
            ma_200: h.stock.ma_200&.to_f,
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
