module TelegramBot
  module Tools
    # Stocks (held + on radar) with an ex-dividend date inside the window.
    # Returns one record per stock with a flag indicating whether the user
    # owns it (so the LLM can say "you'll receive..." vs "you're tracking...").
    class GetUpcomingExDivs
      MAX_DAYS = 60

      def self.call(user:, days: 7)
        window = [ [ days, 1 ].max, MAX_DAYS ].min
        today = Date.current
        cutoff = today + window.days

        held_stock_ids = user.holdings.pluck(:stock_id)
        radar_stock_ids = user.radar&.radar_stocks&.pluck(:stock_id) || []
        candidate_ids = (held_stock_ids + radar_stock_ids).uniq
        return { window_days: window, stocks: [] } if candidate_ids.empty?

        stocks = Stock.where(id: candidate_ids).where(ex_dividend_date: today..cutoff).order(:ex_dividend_date)

        {
          window_days: window,
          stocks: stocks.map do |s|
            {
              symbol: s.symbol,
              ex_dividend_date: s.ex_dividend_date.iso8601,
              dividend_per_share: s.dividend.to_f / dividends_per_year(s),
              currency: s.currency,
              held: held_stock_ids.include?(s.id),
              on_radar: radar_stock_ids.include?(s.id)
            }
          end
        }
      end

      def self.dividends_per_year(stock)
        case stock.payment_frequency
        when "monthly" then 12
        when "semi_annual" then 2
        when "annual" then 1
        else 4
        end
      end
    end
  end
end
