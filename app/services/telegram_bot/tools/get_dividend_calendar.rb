module TelegramBot
  module Tools
    # Projects expected dividend payments for a given calendar month using
    # each held stock's `payment_months` schedule. Complements
    # `GetUpcomingExDivs` (which uses the explicit `ex_dividend_date` field):
    # this tool answers "what dividends do I get next month?" by walking the
    # recurring schedule, even when individual ex-div dates haven't been
    # set yet.
    #
    # `month_offset` is relative to the current month:
    #   0 → this month
    #   1 → next month (default — most common ask)
    #   2 → the month after next, etc.
    # Range capped to keep absurd inputs from doing anything weird.
    class GetDividendCalendar
      MAX_OFFSET = 12

      def self.call(user:, month_offset: 1)
        offset = [ [ month_offset.to_i, 0 ].max, MAX_OFFSET ].min
        target = Date.current.beginning_of_month >> offset
        month_label = target.strftime("%B %Y") # e.g. "November 2026"

        holdings = user.holdings.includes(:stock).select do |h|
          h.stock.payment_months.is_a?(Array) && h.stock.payment_months.include?(target.month)
        end

        payments = holdings.map do |h|
          per_year = dividends_per_year(h.stock)
          per_payment_per_share = (h.stock.dividend || 0).to_f / per_year
          expected = (per_payment_per_share * h.quantity.to_f).round(2)
          {
            symbol: h.stock.symbol,
            quantity: h.quantity.to_f,
            expected_amount: expected,
            currency: h.stock.currency
          }
        end

        totals_by_currency = payments.group_by { |p| p[:currency] }.transform_values do |rows|
          rows.sum { |r| r[:expected_amount] }.round(2)
        end

        {
          month: month_label,
          month_offset: offset,
          payments: payments,
          totals_by_currency: totals_by_currency
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
