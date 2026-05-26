# Path to Freedom — server-side projection.
#
# Same math as app/frontend/lib/motivation.ts (TS file is used for the
# interactive /freedom page; this one feeds the cached summary on the
# logged-in HomePage so the dashboard doesn't pay the per-visit cost of
# re-running the simulation or even fetching holdings).
#
# Returns nil if any required input is missing or the projection can't
# meaningfully start (no portfolio + no monthly invest).
class MotivationProjectionService
  DEFAULT_MAX_YEARS = 60
  CACHE_TTL = 6.hours

  Summary = Struct.new(
    :reached, :years, :months, :days, :total_days,
    :final_portfolio_nominal, :final_portfolio_real,
    :total_contributed_nominal, :total_yield_earned_nominal,
    :current_monthly_dividend, :progress_pct,
    :currency,
    keyword_init: true
  )

  # Cached read for the HomePage mini-panel. The full /freedom page calls
  # the TS simulator with live inputs and doesn't go through this path.
  def self.cached_summary(user)
    Rails.cache.fetch(cache_key(user), expires_in: CACHE_TTL) { call(user) }
  end

  def self.invalidate_cache(user)
    Rails.cache.delete(cache_key(user))
  end

  # Pulls portfolio_value + yield from PortfolioStatsService and the
  # three user-saved inputs, then runs simulate. Returns Summary or nil.
  def self.call(user)
    invest = user.motivation_monthly_invest&.to_f
    objective = user.motivation_monthly_objective&.to_f
    return nil if invest.nil? || objective.nil? || objective <= 0

    stats = PortfolioStatsService.call(user)
    portfolio_value = stats&.dig(:displayMarketValue) || 0.0
    auto_yield = stats&.dig(:displayCurrentYield)
    yield_pct = user.motivation_yield_override_pct&.to_f || auto_yield
    return nil if yield_pct.nil? && portfolio_value > 0
    yield_pct ||= 0.0

    inflation_pct = user.motivation_inflation_pct&.to_f || 2.5

    simulate(
      portfolio_value: portfolio_value,
      yield_rate: yield_pct / 100.0,
      inflation_rate: inflation_pct / 100.0,
      monthly_invest_real: invest,
      monthly_objective_real: objective,
      currency: user.preferred_currency
    )
  end

  # Pure projection — no DB. Mirrors the TS simulate() function in
  # app/frontend/lib/motivation.ts. Kept here for testability.
  def self.simulate(portfolio_value:, yield_rate:, inflation_rate:,
                    monthly_invest_real:, monthly_objective_real:,
                    currency: nil, max_years: DEFAULT_MAX_YEARS)
    y = [ yield_rate.to_f, 0.0 ].max
    infl = inflation_rate.to_f
    m_real = [ monthly_invest_real.to_f, 0.0 ].max
    obj_real = [ monthly_objective_real.to_f, 0.0 ].max
    portfolio = portfolio_value.to_f

    current_monthly_div = portfolio * y / 12.0
    progress_pct = obj_real.positive? ? [ (current_monthly_div / obj_real * 100.0), 100.0 ].min : 0.0

    if obj_real.positive? && current_monthly_div >= obj_real
      return Summary.new(
        reached: true, years: 0, months: 0, days: 0, total_days: 0,
        final_portfolio_nominal: portfolio.round(2),
        final_portfolio_real: portfolio.round(2),
        total_contributed_nominal: 0.0,
        total_yield_earned_nominal: 0.0,
        current_monthly_dividend: current_monthly_div.round(2),
        progress_pct: progress_pct.round(2),
        currency: currency
      )
    end

    contributions_cum = 0.0
    prev_portfolio = portfolio

    max_years.times do |t|
      m_nom = m_real * ((1 + infl)**t)
      contributions_cum += 12 * m_nom
      prev_portfolio = portfolio
      portfolio = portfolio + 12 * m_nom + portfolio * y

      next unless obj_real.positive? && y.positive?

      obj_nom_next = obj_real * ((1 + infl)**(t + 1))
      monthly_div_nom = portfolio * y / 12.0

      next unless monthly_div_nom >= obj_nom_next

      prev_monthly_div = prev_portfolio * y / 12.0
      obj_nom_this = obj_real * ((1 + infl)**t)
      denom = (monthly_div_nom - prev_monthly_div).nonzero? || 1.0
      fraction = ((obj_nom_this - prev_monthly_div) / denom).clamp(0.0, 1.0)
      total_years = t + fraction
      total_days = (total_years * 360).round
      years = total_days / 360
      months = (total_days % 360) / 30
      days = total_days % 30

      final_real = portfolio / ((1 + infl)**(t + 1))

      return Summary.new(
        reached: true, years: years, months: months, days: days, total_days: total_days,
        final_portfolio_nominal: portfolio.round(2),
        final_portfolio_real: final_real.round(2),
        total_contributed_nominal: contributions_cum.round(2),
        total_yield_earned_nominal: (portfolio - portfolio_value - contributions_cum).round(2),
        current_monthly_dividend: current_monthly_div.round(2),
        progress_pct: progress_pct.round(2),
        currency: currency
      )
    end

    final_real = portfolio / ((1 + infl)**max_years)
    Summary.new(
      reached: false, years: max_years, months: 0, days: 0, total_days: max_years * 360,
      final_portfolio_nominal: portfolio.round(2),
      final_portfolio_real: final_real.round(2),
      total_contributed_nominal: contributions_cum.round(2),
      total_yield_earned_nominal: (portfolio - portfolio_value - contributions_cum).round(2),
      current_monthly_dividend: current_monthly_div.round(2),
      progress_pct: progress_pct.round(2),
      currency: currency
    )
  end

  def self.cache_key(user)
    [ "motivation_projection", user.id ]
  end
end
