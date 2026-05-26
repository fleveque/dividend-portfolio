require "ostruct"

module Demos
  # Returns a single curated payload that the public `/api/v1/demo` endpoint
  # serves and the React frontend prefills into React Query under the same
  # keys the real hooks use (`['radar']`, `['holdings']`, `['dividends']`,
  # `['dividends', 'chart', ...]`). Anonymous visitors browsing `/demo` then
  # see realistic data without any DB persistence — nothing here is saved,
  # so community aggregates (Stocks::CommunityTargetPrice, Most Held, etc.)
  # are unaffected.
  #
  # Stocks are instantiated as unsaved AR objects with a fake `id`, so
  # `StockDecorator` works without touching the DB.
  class DataBundle
    UPCOMING_EX_DIV_DAYS = 5

    # Demo investor profile — drives the /demo dashboard (greeting, Path to
    # Freedom summary). Tuned so the projection lands on a motivational
    # ~25y horizon given the demo portfolio's size and ~3% blended yield;
    # tweak only with the resulting ETA in mind ("Beyond 60 years" is a
    # buzzkill on the showcase).
    DEMO_PROFILE_DEFAULTS = {
      email_address: "demo@quantic.app",
      preferred_currency: "USD",
      motivation_monthly_invest: 1500,
      motivation_monthly_objective: 2000,
      motivation_inflation_pct: 2.5
    }.freeze

    def self.call
      new.call
    end

    def call
      stocks = build_stocks
      holding_records = build_holding_records(stocks)
      radar_records = build_radar_records(stocks)
      dividend_records = build_dividend_records(stocks, holding_records)
      holdings_section = holdings_payload(holding_records)

      {
        profile: profile_payload(holdings_section[:portfolioStats]),
        radar: radar_payload(radar_records),
        holdings: holdings_section,
        dividends: dividend_records.map { |row| serialize_dividend(row) },
        # Default chart: 12 months back + 12 forward (24 months). Full chart:
        # from earliest dividend (~24 months back) + 12 forward (36 months).
        # Full must have strictly more months than default for the historic
        # line chart to render on /demo/dividends.
        chart: chart_payload(dividend_records, holding_records, months_back: 12),
        chartFull: chart_payload(dividend_records, holding_records, months_back: 24)
      }
    end

    private

    # ─── Stocks ─────────────────────────────────────────────────────────────

    def build_stocks
      [
        new_stock(id: 9001, symbol: "AAPL", name: "Apple Inc.",
                  currency: "USD", price: 178.50,
                  eps: 6.05, pe_ratio: 29.5, dividend: 1.00, dividend_yield: 0.56,
                  payout_ratio: 16.5, ma_50: 175.20, ma_200: 168.40,
                  fifty_two_week_high: 199.62, fifty_two_week_low: 164.08,
                  ex_dividend_date: 30.days.from_now.to_date,
                  payment_frequency: "quarterly", payment_months: [ 2, 5, 8, 11 ],
                  sector: "Technology"),
        new_stock(id: 9002, symbol: "KO", name: "Coca-Cola Company",
                  currency: "USD", price: 62.50,
                  eps: 2.50, pe_ratio: 25.0, dividend: 1.94, dividend_yield: 3.10,
                  payout_ratio: 77.6, ma_50: 61.00, ma_200: 60.20,
                  fifty_two_week_high: 65.00, fifty_two_week_low: 55.10,
                  ex_dividend_date: UPCOMING_EX_DIV_DAYS.days.from_now.to_date,
                  payment_frequency: "quarterly", payment_months: [ 3, 6, 9, 12 ],
                  sector: "Consumer Defensive"),
        new_stock(id: 9003, symbol: "JNJ", name: "Johnson & Johnson",
                  currency: "USD", price: 158.20,
                  eps: 9.85, pe_ratio: 16.1, dividend: 4.96, dividend_yield: 3.14,
                  payout_ratio: 50.4, ma_50: 156.00, ma_200: 154.80,
                  fifty_two_week_high: 175.97, fifty_two_week_low: 143.13,
                  ex_dividend_date: 50.days.from_now.to_date,
                  payment_frequency: "quarterly", payment_months: [ 3, 6, 9, 12 ],
                  sector: "Healthcare"),
        new_stock(id: 9004, symbol: "O", name: "Realty Income Corporation",
                  currency: "USD", price: 56.20,
                  eps: 1.28, pe_ratio: 43.9, dividend: 3.21, dividend_yield: 5.71,
                  payout_ratio: 250.7, ma_50: 55.80, ma_200: 54.50,
                  fifty_two_week_high: 64.78, fifty_two_week_low: 50.71,
                  ex_dividend_date: 12.days.from_now.to_date,
                  payment_frequency: "monthly", payment_months: (1..12).to_a,
                  sector: "Real Estate"),
        # Radar-only:
        new_stock(id: 9005, symbol: "MSFT", name: "Microsoft Corporation",
                  currency: "USD", price: 380.00,
                  eps: 11.05, pe_ratio: 34.4, dividend: 3.00, dividend_yield: 0.79,
                  payout_ratio: 27.1, ma_50: 372.00, ma_200: 355.00,
                  fifty_two_week_high: 420.82, fifty_two_week_low: 309.45,
                  ex_dividend_date: 60.days.from_now.to_date,
                  payment_frequency: "quarterly", payment_months: [ 3, 6, 9, 12 ],
                  sector: "Technology"),
        new_stock(id: 9006, symbol: "PEP", name: "PepsiCo, Inc.",
                  currency: "USD", price: 172.40,
                  eps: 7.05, pe_ratio: 24.5, dividend: 5.42, dividend_yield: 3.14,
                  payout_ratio: 76.9, ma_50: 170.00, ma_200: 168.50,
                  fifty_two_week_high: 196.95, fifty_two_week_low: 155.83,
                  ex_dividend_date: 75.days.from_now.to_date,
                  payment_frequency: "quarterly", payment_months: [ 1, 3, 6, 9 ],
                  sector: "Consumer Defensive"),
        new_stock(id: 9007, symbol: "REP.MC", name: "Repsol S.A.",
                  currency: "EUR", price: 13.45,
                  eps: 1.20, pe_ratio: 11.2, dividend: 0.90, dividend_yield: 6.69,
                  payout_ratio: 75.0, ma_50: 13.20, ma_200: 13.80,
                  fifty_two_week_high: 15.92, fifty_two_week_low: 11.40,
                  ex_dividend_date: 20.days.from_now.to_date,
                  payment_frequency: "semi_annual", payment_months: [ 1, 7 ],
                  sector: "Energy")
      ]
    end

    def new_stock(id:, symbol:, name:, **attrs)
      stock = Stock.new(symbol: symbol, name: name, **attrs)
      stock.id = id
      stock
    end

    # ─── Holdings ───────────────────────────────────────────────────────────

    # Each holding has a current quantity *and* a DCA tranche schedule so the
    # dividend chart shows a natural upward trend: early payments use the
    # smaller historical quantity, recent payments use the current quantity.
    # `tranches` is [months-ago, shares-bought], and the sum equals the
    # current quantity.
    def holding_configs
      {
        "AAPL"   => { avg_price: 145.00, tranches: [ [ 20, 10 ], [ 6, 15 ] ] },           # → 25
        "KO"     => { avg_price: 58.00,  tranches: [ [ 22, 40 ], [ 10, 60 ] ] },          # → 100
        "JNJ"    => { avg_price: 162.50, tranches: [ [ 18, 8 ], [ 4, 12 ] ] },            # → 20
        "O"      => { avg_price: 58.40,  tranches: [ [ 20, 25 ], [ 12, 25 ], [ 5, 25 ] ] }, # → 75
        "REP.MC" => { avg_price: 12.10,  tranches: [ [ 15, 80 ], [ 7, 120 ] ] }           # → 200
      }
    end

    def build_holding_records(stocks)
      configs = holding_configs
      held = stocks.select { |s| configs.key?(s.symbol) }

      held.each_with_index.map do |stock, i|
        config = configs[stock.symbol]
        OpenStruct.new(
          id: 8001 + i,
          stock: stock,
          stock_id: stock.id,
          quantity: config[:tranches].sum { |_m, q| q },
          average_price: config[:avg_price],
          tranches: config[:tranches].map { |months, qty| { date: Date.current - months.months, qty: qty } }
        )
      end
    end

    # Quantity owned on the given date — sum of all tranches whose purchase
    # date is on/before that date.
    def quantity_at(holding, date)
      holding.tranches.select { |t| t[:date] <= date }.sum { |t| t[:qty] }
    end

    def holdings_payload(holding_records)
      totals = Hash.new { |h, k| h[k] = { value: 0.0, cost: 0.0 } }

      serialized = holding_records.map do |h|
        market_value = (h.stock.price || 0) * h.quantity
        cost = h.average_price * h.quantity
        gain_loss = market_value - cost
        gain_loss_percent = cost > 0 ? (gain_loss / cost * 100) : 0

        totals[h.stock.currency][:value] += market_value
        totals[h.stock.currency][:cost] += cost

        {
          id: h.id,
          quantity: h.quantity.to_f,
          averagePrice: h.average_price.to_f,
          marketValue: market_value.to_f,
          gainLoss: gain_loss.to_f,
          gainLossPercent: gain_loss_percent.to_f,
          stock: serialize_stock(h.stock)
        }
      end

      {
        holdings: serialized,
        totalsByCurrency: totals_payload(totals),
        displayTotal: nil, # demo skips FX conversion display
        portfolioStats: portfolio_stats_payload(holding_records)
      }
    end

    def totals_payload(totals)
      # Coerce to Float — Stock#price is BigDecimal, which JSON serialises as a
      # string by default, breaking `.toFixed()` on the React side.
      totals.transform_values do |t|
        value = t[:value].to_f
        cost = t[:cost].to_f
        gl = value - cost
        gl_pct = cost > 0 ? (gl / cost * 100) : 0.0
        {
          value: value.round(2),
          cost: cost.round(2),
          gainLoss: gl.round(2),
          gainLossPercent: gl_pct.round(2)
        }
      end
    end

    def portfolio_stats_payload(holdings)
      market_total = holdings.sum { |h| (h.stock.price || 0) * h.quantity }.to_f

      by_currency = holdings.group_by { |h| h.stock.currency }.transform_values do |hs|
        gross = hs.sum { |h| (h.stock.dividend || 0) * h.quantity }.to_f
        cost = hs.sum { |h| h.average_price * h.quantity }.to_f
        market = hs.sum { |h| (h.stock.price || 0) * h.quantity }.to_f
        {
          yoc: cost > 0 ? (gross / cost * 100).round(2) : 0.0,
          currentYield: market > 0 ? (gross / market * 100).round(2) : 0.0
        }
      end

      sectors = holdings
        .group_by { |h| h.stock.sector || "Unknown" }
        .map do |sector, hs|
          value = hs.sum { |h| (h.stock.price || 0) * h.quantity }.to_f
          { sector: sector, value: value.round(2), percent: market_total > 0 ? (value / market_total * 100).round(1) : 0.0 }
        end
        .sort_by { |s| -s[:value] }

      display = by_currency["USD"] || by_currency.values.first || { yoc: 0.0, currentYield: 0.0 }

      {
        byCurrency: by_currency,
        displayCurrency: by_currency.key?("USD") ? "USD" : by_currency.keys.first,
        displayMarketValue: market_total.round(2),
        displayYoc: display[:yoc],
        displayCurrentYield: display[:currentYield],
        sectors: sectors
      }
    end

    # ─── Profile ────────────────────────────────────────────────────────────

    # Serialised user profile prefilled into the React Query cache so the
    # /demo dashboard can render the logged-in home without hitting the
    # auth-only /api/v1/profile endpoint. The motivation summary is
    # precomputed here (same shape MotivationProjectionService emits) so
    # the Path to Freedom mini-panel works out of the box.
    def profile_payload(portfolio_stats)
      defaults = DEMO_PROFILE_DEFAULTS
      portfolio_value = portfolio_stats[:displayMarketValue].to_f
      yield_pct = portfolio_stats[:displayCurrentYield].to_f

      summary = MotivationProjectionService.simulate(
        portfolio_value: portfolio_value,
        yield_rate: yield_pct / 100.0,
        inflation_rate: defaults[:motivation_inflation_pct] / 100.0,
        monthly_invest_real: defaults[:motivation_monthly_invest],
        monthly_objective_real: defaults[:motivation_monthly_objective],
        currency: defaults[:preferred_currency]
      )

      {
        id: 9999,
        emailAddress: defaults[:email_address],
        portfolioSlug: nil,
        preferredCurrency: defaults[:preferred_currency],
        locale: "en",
        sharePortfolio: false,
        shareRadar: false,
        motivationMonthlyInvest: defaults[:motivation_monthly_invest].to_f,
        motivationMonthlyObjective: defaults[:motivation_monthly_objective].to_f,
        motivationInflationPct: defaults[:motivation_inflation_pct].to_f,
        motivationYieldOverridePct: nil,
        # Tuned in tandem with the monthly_invest above so the back-projected
        # past actually has multiple data points to draw (high monthly
        # invest collapses the past quickly to $0). 2 years of visible
        # history before today reads well on the chart.
        motivationStartYear: Date.current.year - 2,
        motivationSummary: serialize_motivation_summary(summary)
      }
    end

    def serialize_motivation_summary(summary)
      return nil unless summary

      {
        reached: summary.reached,
        years: summary.years,
        months: summary.months,
        days: summary.days,
        totalDays: summary.total_days,
        finalPortfolioNominal: summary.final_portfolio_nominal,
        finalPortfolioReal: summary.final_portfolio_real,
        totalContributedNominal: summary.total_contributed_nominal,
        totalYieldEarnedNominal: summary.total_yield_earned_nominal,
        currentMonthlyDividend: summary.current_monthly_dividend,
        progressPct: summary.progress_pct,
        currency: summary.currency
      }
    end

    # ─── Radar ──────────────────────────────────────────────────────────────

    def build_radar_records(stocks)
      # Mix of below-target (buy signal, e.g. JNJ, MSFT, O, REP.MC) and
      # above-target (overpriced, e.g. AAPL, KO, PEP) so the radar visibly
      # surfaces actionable cards.
      target_prices = {
        "AAPL" => 160.00, "KO" => 60.00, "JNJ" => 170.00, "O" => 60.00,
        "MSFT" => 400.00, "PEP" => 165.00, "REP.MC" => 14.50
      }
      stocks.map do |stock|
        OpenStruct.new(stock: stock, target_price: target_prices[stock.symbol])
      end
    end

    def radar_payload(radar_records)
      {
        id: 7001,
        stocks: radar_records.map do |rs|
          stock_json = serialize_stock(rs.stock).merge(
            targetPrice: rs.target_price,
            formattedTargetPrice: format_currency(rs.target_price, rs.stock.currency),
            priceStatusClass: price_status_class(rs.stock.price, rs.target_price),
            percentageDifference: percentage_difference(rs.stock.price, rs.target_price),
            aboveTarget: rs.stock.price && rs.target_price && rs.stock.price > rs.target_price,
            belowTarget: rs.stock.price && rs.target_price && rs.stock.price < rs.target_price,
            atTarget: rs.stock.price && rs.target_price && rs.stock.price == rs.target_price,
            targetAnchors: {
              community: { value: nil, count: 0 }, # below threshold; demo has no community
              fiftyTwoWeekMidpoint: midpoint(rs.stock),
              ma200: rs.stock.ma_200&.to_f,
              ma50: rs.stock.ma_50&.to_f
            }
          )
          stock_json
        end
      }
    end

    def price_status_class(price, target)
      return "" unless price && target
      return "text-emerald-600" if price < target
      return "text-red-600" if price > target
      "text-muted-foreground"
    end

    def percentage_difference(price, target)
      return nil unless price && target && target > 0
      pct = ((price - target).abs / target * 100).round(2)
      "#{pct}%"
    end

    def midpoint(stock)
      return nil if stock.fifty_two_week_high.blank? || stock.fifty_two_week_low.blank?
      ((stock.fifty_two_week_high.to_f + stock.fifty_two_week_low.to_f) / 2.0).round(2)
    end

    # ─── Dividends ──────────────────────────────────────────────────────────

    def build_dividend_records(_stocks, holdings)
      # ~24 months of historical dividends. Quantity owned at each payment is
      # derived from the holding's tranches, so early payments naturally have
      # smaller amounts and the chart trends upward as the investor DCAs in.
      records = []
      id = 6000
      today = Date.current

      holdings.each do |h|
        stock = h.stock
        per_year = case stock.payment_frequency
        when "monthly" then 12
        when "semi_annual" then 2
        when "annual" then 1
        else 4
        end
        per_payment = (stock.dividend || 0) / per_year
        next if per_payment.zero?

        total_payments = per_year * 2 # cover ~24 months back
        total_payments.times do |i|
          months_back = (i * 12 / per_year)
          payment_date = (today - months_back.months).beginning_of_month + 14.days
          next if payment_date > today

          qty = quantity_at(h, payment_date)
          next if qty.zero? # no shares yet, no payment

          amount = (per_payment * qty).round(2)
          id += 1
          source = i.even? ? "ibkr" : "manual"
          tax = amount * 0.15
          records << OpenStruct.new(
            id: id,
            stock: stock,
            date: payment_date,
            currency: stock.currency,
            per_share_amount: per_payment.round(4),
            quantity: qty,
            amount: amount,
            withholding_tax: tax.round(2),
            source: source
          )
        end
      end

      records.sort_by { |r| -r.date.to_time.to_i }
    end

    def serialize_dividend(d)
      net = d.amount - d.withholding_tax
      {
        id: d.id,
        stockId: d.stock.id,
        symbol: d.stock.symbol,
        name: d.stock.name,
        date: d.date.iso8601,
        perShareAmount: d.per_share_amount&.to_f,
        quantity: d.quantity,
        amount: d.amount.to_f,
        currency: d.currency,
        withholdingTax: d.withholding_tax.to_f,
        netAmount: net.to_f,
        source: d.source
      }
    end

    # ─── Chart data ─────────────────────────────────────────────────────────

    def chart_payload(dividends, holding_records, months_back:, months_forward: 12)
      current_month_start = Date.current.beginning_of_month
      start_month = current_month_start - months_back.months
      months = (0..(months_back + months_forward - 1)).map do |i|
        (start_month + i.months).strftime("%Y-%m")
      end

      currencies = (dividends.map(&:currency) + holding_records.map { |h| h.stock.currency }).uniq
      projections = projected_monthly_totals(holding_records, months, current_month_start)

      by_currency = {}
      currencies.each do |ccy|
        by_currency[ccy] = months.map do |month|
          month_start = Date.parse("#{month}-01")
          is_past = month_start <= current_month_start
          actual_total = dividends.select { |d| d.currency == ccy && d.date.strftime("%Y-%m") == month }
                                  .sum(&:amount).to_f.round(2)
          projected = projections.dig(ccy, month)&.round(2)
          {
            month: month,
            actual: actual_total > 0 ? actual_total : nil,
            projected: is_past ? nil : (projected || 0.0)
          }
        end
      end

      { byCurrency: by_currency, months: months }
    end

    # For every future month in the window, project per-stock payments using
    # the holding's current quantity and the stock's `payment_months` (which
    # months of the year it pays). Past months get nil projections.
    def projected_monthly_totals(holdings, months, current_month_start)
      totals = Hash.new { |h, k| h[k] = Hash.new(0.0) }

      holdings.each do |h|
        stock = h.stock
        per_year = case stock.payment_frequency
        when "monthly" then 12
        when "semi_annual" then 2
        when "annual" then 1
        else 4
        end
        per_payment = (stock.dividend || 0) / per_year
        next unless per_payment.positive?
        next if stock.payment_months.blank?

        income_per_payment = (per_payment * h.quantity).to_f
        currency = stock.currency

        months.each do |month_key|
          month_start = Date.parse("#{month_key}-01")
          next if month_start <= current_month_start # only future
          totals[currency][month_key] += income_per_payment if stock.payment_months.include?(month_start.month)
        end
      end

      totals
    end

    # ─── Shared serializer ──────────────────────────────────────────────────

    def serialize_stock(stock)
      decorated = StockDecorator.new(stock)
      {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currency: stock.currency,
        price: stock.price,
        formattedPrice: decorated.formatted_price,
        eps: stock.eps,
        peRatio: stock.pe_ratio,
        dividend: stock.dividend,
        dividendYield: stock.dividend_yield,
        payoutRatio: stock.payout_ratio,
        ma50: stock.ma_50,
        ma200: stock.ma_200,
        formattedEps: decorated.formatted_eps,
        formattedPeRatio: decorated.formatted_pe_ratio,
        formattedDividend: decorated.formatted_dividend,
        formattedDividendYield: decorated.formatted_dividend_yield,
        formattedPayoutRatio: decorated.formatted_payout_ratio,
        formattedMa50: decorated.formatted_ma_50,
        formattedMa200: decorated.formatted_ma_200,
        exDividendDate: stock.ex_dividend_date&.iso8601,
        paymentFrequency: stock.payment_frequency,
        paymentMonths: decorated.payment_months,
        shiftedPaymentMonths: decorated.shifted_payment_months,
        dividendPerPayment: decorated.dividend_per_payment,
        formattedDividendPerPayment: decorated.formatted_dividend_per_payment,
        formattedPaymentFrequency: decorated.formatted_payment_frequency,
        formattedExDividendDate: decorated.formatted_ex_dividend_date,
        dividendScheduleAvailable: decorated.dividend_schedule_available?,
        dividendScore: decorated.dividend_score,
        dividendScoreLabel: decorated.dividend_score_label,
        fiftyTwoWeekHigh: stock.fifty_two_week_high,
        fiftyTwoWeekLow: stock.fifty_two_week_low,
        formattedFiftyTwoWeekHigh: decorated.formatted_fifty_two_week_high,
        formattedFiftyTwoWeekLow: decorated.formatted_fifty_two_week_low,
        fiftyTwoWeekRangePosition: decorated.fifty_two_week_range_position,
        fiftyTwoWeekDataAvailable: decorated.fifty_two_week_data_available?
      }
    end

    def format_currency(amount, currency)
      symbol = Stock::CURRENCY_SYMBOLS[currency] || "#{currency} "
      "#{symbol}#{format('%.2f', amount.to_f)}"
    end
  end
end
