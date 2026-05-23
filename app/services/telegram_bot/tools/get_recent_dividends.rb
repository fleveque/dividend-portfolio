module TelegramBot
  module Tools
    # Most-recent dividend payments, capped to a reasonable upper bound so
    # the LLM context doesn't balloon.
    class GetRecentDividends
      MAX = 25

      def self.call(user:, limit: 10)
        n = [ [ limit, 1 ].max, MAX ].min
        rows = user.dividends.includes(:stock).order(date: :desc).limit(n)
        {
          dividends: rows.map do |d|
            {
              symbol: d.stock.symbol,
              date: d.date.iso8601,
              amount: d.amount.to_f,
              currency: d.currency,
              withholding_tax: d.withholding_tax.to_f,
              net: (d.amount.to_f - d.withholding_tax.to_f).round(2),
              source: d.source
            }
          end
        }
      end
    end
  end
end
