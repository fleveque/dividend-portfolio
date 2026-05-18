module Dividends
  # Builds monthly bucket data for the Dividends page charts.
  #
  # Returns *per-currency* series so we don't have to fake-convert with current
  # FX rates (each currency keeps its own scale and the user can read each
  # series honestly).
  #
  # Past months: actual gross dividends received, summed per currency per month.
  # Future months: projection from current Holdings — for each holding with a
  # known dividend schedule, add `dividend_per_payment × quantity` for every
  # future month in `stock.payment_months`, attributed to the stock's currency.
  # Current month is past-only to avoid double-counting already-received
  # payments.
  class ChartData
    RANGE_FULL = "full".freeze

    def self.call(user:, months_back: 12, months_forward: 12, range: nil)
      new(user: user, months_back: months_back, months_forward: months_forward, range: range).call
    end

    def initialize(user:, months_back:, months_forward:, range:)
      @user = user
      @months_back = months_back
      @months_forward = months_forward
      @range = range
    end

    def call
      window_start = resolved_window_start
      window_end = current_month_start + @months_forward.months
      months = month_range(window_start, window_end)

      actuals = actual_monthly_totals(window_start) # { ccy => { "YYYY-MM" => Float } }
      projections = projected_monthly_totals(window_end)
      currencies = (actuals.keys + projections.keys).uniq.sort

      by_currency = currencies.each_with_object({}) do |ccy, h|
        h[ccy] = months.map do |month_start|
          key = month_key(month_start)
          is_past = month_start <= current_month_start
          {
            month: key,
            actual: is_past ? (actuals.dig(ccy, key) || 0).round(2) : nil,
            projected: !is_past ? (projections.dig(ccy, key) || 0).round(2) : nil
          }
        end
      end

      {
        byCurrency: by_currency,
        months: months.map { |m| month_key(m) }
      }
    end

    private

    def current_month_start
      @current_month_start ||= Date.current.beginning_of_month
    end

    def resolved_window_start
      if @range == RANGE_FULL
        first = @user.dividends.minimum(:date)
        return first.beginning_of_month if first
      end
      current_month_start - @months_back.months
    end

    def month_range(start_date, end_date)
      months = []
      cur = start_date
      while cur < end_date
        months << cur
        cur = cur.next_month
      end
      months
    end

    def month_key(date)
      date.strftime("%Y-%m")
    end

    def actual_monthly_totals(window_start)
      totals = Hash.new { |h, k| h[k] = Hash.new(0) }
      @user.dividends
           .where("date >= ?", window_start)
           .where("date < ?", current_month_start.next_month)
           .each do |d|
        totals[d.currency][month_key(d.date)] += d.amount.to_f
      end
      totals
    end

    def projected_monthly_totals(window_end)
      totals = Hash.new { |h, k| h[k] = Hash.new(0) }

      @user.holdings.includes(:stock).each do |holding|
        stock = holding.stock
        decorated = StockDecorator.new(stock)
        per_payment = decorated.dividend_per_payment
        next unless per_payment&.positive?
        next if decorated.payment_months.blank?

        income_per_payment = per_payment * holding.quantity
        currency = stock.currency

        current = current_month_start.next_month
        while current < window_end
          if decorated.payment_months.include?(current.month) && !decorated.shifted_payment_months.include?(current.month)
            totals[currency][month_key(current)] += income_per_payment
          end
          current = current.next_month
        end
      end

      totals
    end
  end
end
