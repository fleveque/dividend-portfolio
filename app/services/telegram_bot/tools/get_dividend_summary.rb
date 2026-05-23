module TelegramBot
  module Tools
    # Aggregated dividend totals over a named period, grouped by currency.
    # Periods are word-aliases the LLM can pick from naturally.
    class GetDividendSummary
      def self.call(user:, period:)
        range = period_range(period)
        return { error: "Unknown period: #{period}" } if range.nil?

        scope = user.dividends.where(date: range)
        return { period: period, currencies: {}, count: 0 } if scope.empty?

        currencies = scope.group(:currency).select(
          "currency, SUM(amount) AS gross, SUM(withholding_tax) AS tax, COUNT(*) AS count"
        ).each_with_object({}) do |row, acc|
          acc[row.currency] = {
            gross: row.gross.to_f.round(2),
            withholding_tax: row.tax.to_f.round(2),
            net: (row.gross.to_f - row.tax.to_f).round(2),
            count: row.count.to_i
          }
        end

        {
          period: period,
          range: { from: range.begin.iso8601, to: range.end.iso8601 },
          currencies: currencies,
          count: scope.count
        }
      end

      def self.period_range(period)
        today = Date.current
        case period.to_s
        when "this_month" then today.beginning_of_month..today.end_of_month
        when "last_month" then (today << 1).beginning_of_month..(today << 1).end_of_month
        when "ytd" then today.beginning_of_year..today
        when "last_12_months" then (today << 12)..today
        end
      end
    end
  end
end
