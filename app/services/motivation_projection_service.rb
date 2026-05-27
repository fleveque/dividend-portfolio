# Path to Freedom — server-side projection.
#
# Same math as app/frontend/lib/motivation.ts. Two phases:
#   1. Accumulation — three capital pools (dividend, interest, growth) grow
#      with their respective rates; monthly contributions flow into the
#      dividend pool; dividends reinvest; interest reinvests if the user
#      opted in; growth pool compounds. Goal reached when annualised
#      (dividends + paid-out interest) covers the inflation-adjusted goal.
#   2. Distribution — dividends and interest are paid out as income;
#      growth pool keeps compounding; each year we sell whatever's needed
#      to top passive income up to the inflation-adjusted goal. Sales
#      come from the growth pool first; only when that's exhausted do we
#      eat into the dividend/interest pools (which then erodes future
#      passive income). Sustainability ends when remaining capital can't
#      cover the shortfall.
#
# Returns nil if the inputs don't define a meaningful projection.
class MotivationProjectionService
  # 80-year horizon: enough room for both a long accumulation (~40y) and
  # a long distribution (~40y) so the capital-depletion chart actually
  # reaches zero in realistic scenarios. 60 was too tight.
  DEFAULT_MAX_YEARS = 80
  CACHE_TTL = 6.hours

  Summary = Struct.new(
    :reached, :years, :months, :days, :total_days,
    :final_portfolio_nominal, :final_portfolio_real,
    :total_contributed_nominal, :total_yield_earned_nominal,
    :current_monthly_dividend, :progress_pct,
    :currency,
    :years_sustained_post_goal,
    :years_until_capital_gone,
    keyword_init: true
  )

  def self.cached_summary(user)
    Rails.cache.fetch(cache_key(user), expires_in: CACHE_TTL) { call(user) }
  end

  def self.invalidate_cache(user)
    Rails.cache.delete(cache_key(user))
  end

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

    # Forced-retirement trigger requires both the target age and the
    # birth year (to know how many years from today that is).
    years_to_retirement = nil
    if user.motivation_retirement_age.present? && user.motivation_birth_year.present?
      current_age = Date.current.year - user.motivation_birth_year
      years_to_retirement = [ user.motivation_retirement_age - current_age, 0 ].max
    end

    simulate(
      portfolio_value: portfolio_value,
      yield_rate: yield_pct / 100.0,
      inflation_rate: inflation_pct / 100.0,
      monthly_invest_real: invest,
      monthly_objective_real: objective,
      interest_capital: user.motivation_interest_capital&.to_f || 0.0,
      interest_rate: (user.motivation_interest_rate_pct&.to_f || 0.0) / 100.0,
      reinvest_interest: user.motivation_reinvest_interest != false,
      growth_capital: user.motivation_growth_capital&.to_f || 0.0,
      growth_rate: (user.motivation_growth_rate_pct&.to_f || 0.0) / 100.0,
      years_to_retirement: years_to_retirement,
      currency: user.preferred_currency
    )
  end

  # Pure projection — no DB. Mirrors simulate() in app/frontend/lib/motivation.ts.
  def self.simulate(portfolio_value:, yield_rate:, inflation_rate:,
                    monthly_invest_real:, monthly_objective_real:,
                    interest_capital: 0.0, interest_rate: 0.0,
                    reinvest_interest: true,
                    growth_capital: 0.0, growth_rate: 0.0,
                    years_to_retirement: nil,
                    currency: nil, max_years: DEFAULT_MAX_YEARS)
    y_div = [ yield_rate.to_f, 0.0 ].max
    y_int = [ interest_rate.to_f, 0.0 ].max
    g     = growth_rate.to_f
    infl  = inflation_rate.to_f
    m_real = [ monthly_invest_real.to_f, 0.0 ].max
    obj_real = [ monthly_objective_real.to_f, 0.0 ].max

    p_div    = portfolio_value.to_f
    p_int    = [ interest_capital.to_f, 0.0 ].max
    p_growth = [ growth_capital.to_f, 0.0 ].max

    # Current passive income for goal check: dividends + (interest if paid out)
    current_passive = (p_div * y_div) + (reinvest_interest ? 0.0 : p_int * y_int)
    current_monthly_div = current_passive / 12.0
    progress_pct = obj_real.positive? ? [ (current_monthly_div / obj_real * 100.0), 100.0 ].min : 0.0

    initial_total_capital = p_div + p_int + p_growth

    goal_met_now = obj_real.positive? && current_monthly_div >= obj_real
    retirement_now = !years_to_retirement.nil? && years_to_retirement <= 0

    if goal_met_now || retirement_now
      total_capital = initial_total_capital
      outcome = distribution_outcome(
        obj_real: obj_real, infl: infl, g: g,
        y_div: y_div, y_int: y_int,
        p_div: p_div, p_int: p_int, p_growth: p_growth,
        goal_year_offset: 0, max_years: max_years
      )
      return Summary.new(
        reached: true, years: 0, months: 0, days: 0, total_days: 0,
        final_portfolio_nominal: total_capital.round(2),
        final_portfolio_real: total_capital.round(2),
        total_contributed_nominal: 0.0,
        total_yield_earned_nominal: 0.0,
        current_monthly_dividend: current_monthly_div.round(2),
        progress_pct: progress_pct.round(2),
        currency: currency,
        years_sustained_post_goal: outcome[:years_sustained],
        years_until_capital_gone: outcome[:years_until_capital_gone]
      )
    end

    contributions_cum = 0.0
    prev_total = initial_total_capital
    prev_monthly_passive = current_monthly_div

    max_years.times do |t|
      m_nom = m_real * ((1 + infl)**t)
      contributions_cum += 12 * m_nom

      # Pool evolution over year t -> t+1.
      div_income_year = p_div * y_div
      int_income_year = p_int * y_int

      p_div    = p_div + 12 * m_nom + div_income_year                       # contributions + reinvest dividends
      p_int    = p_int + (reinvest_interest ? int_income_year : 0.0)       # compound only if reinvesting
      p_growth = p_growth * (1 + g)

      prev_total = p_div + p_int + p_growth

      next unless obj_real.positive?

      # Passive income at end of year (t+1) — recompute from updated pools
      # so the goal check uses the right base. Interest is income only if
      # the user is NOT reinvesting it.
      passive_annual = p_div * y_div + (reinvest_interest ? 0.0 : p_int * y_int)
      monthly_passive = passive_annual / 12.0
      obj_nom_next = obj_real * ((1 + infl)**(t + 1))

      goal_met = monthly_passive >= obj_nom_next
      retirement_reached = !years_to_retirement.nil? && (t + 1) >= years_to_retirement

      if goal_met || retirement_reached
        # When goal triggers, interpolate to find sub-year precision.
        # When retirement triggers without goal, the user "retires on
        # their birthday" — full year boundary, no fractional days.
        if goal_met
          obj_nom_this = obj_real * ((1 + infl)**t)
          denom = (monthly_passive - prev_monthly_passive).nonzero? || 1.0
          fraction = ((obj_nom_this - prev_monthly_passive) / denom).clamp(0.0, 1.0)
          total_years = t + fraction
        else
          total_years = (t + 1).to_f
        end
        total_days = (total_years * 360).round
        years_int = total_days / 360
        months = (total_days % 360) / 30
        days = total_days % 30

        total_capital = prev_total
        final_real = total_capital / ((1 + infl)**(t + 1))

        outcome = distribution_outcome(
          obj_real: obj_real, infl: infl, g: g,
          y_div: y_div, y_int: y_int,
          p_div: p_div, p_int: p_int, p_growth: p_growth,
          goal_year_offset: t + 1, max_years: max_years
        )

        return Summary.new(
          reached: true, years: years_int, months: months, days: days, total_days: total_days,
          final_portfolio_nominal: total_capital.round(2),
          final_portfolio_real: final_real.round(2),
          total_contributed_nominal: contributions_cum.round(2),
          total_yield_earned_nominal: (total_capital - initial_total_capital - contributions_cum).round(2),
          current_monthly_dividend: current_monthly_div.round(2),
          progress_pct: progress_pct.round(2),
          currency: currency,
          years_sustained_post_goal: outcome[:years_sustained],
          years_until_capital_gone: outcome[:years_until_capital_gone]
        )
      end

      prev_monthly_passive = monthly_passive
    end

    final_real = prev_total / ((1 + infl)**max_years)
    Summary.new(
      reached: false, years: max_years, months: 0, days: 0, total_days: max_years * 360,
      final_portfolio_nominal: prev_total.round(2),
      final_portfolio_real: final_real.round(2),
      total_contributed_nominal: contributions_cum.round(2),
      total_yield_earned_nominal: (prev_total - initial_total_capital - contributions_cum).round(2),
      current_monthly_dividend: current_monthly_div.round(2),
      progress_pct: progress_pct.round(2),
      currency: currency,
      years_sustained_post_goal: nil,
      years_until_capital_gone: nil
    )
  end

  # Post-goal distribution outcome — capped adaptive withdrawal. Sells
  # up to the inflation-adjusted gap between passive income (dividends
  # + interest) and the goal, but never more than 4% of the capital at
  # distribution start (inflated each year — the SWR ceiling). Sales
  # come from the growth pool first, then the dividend/interest pools.
  # The loop continues past the "income drops below goal" point until
  # total capital is zero, so we can also report capital depletion.
  # Returns a Hash with :years_sustained and :years_until_capital_gone.
  def self.distribution_outcome(obj_real:, infl:, g:,
                                y_div:, y_int:,
                                p_div:, p_int:, p_growth:,
                                goal_year_offset:, max_years:)
    return { years_sustained: nil, years_until_capital_gone: nil } if obj_real <= 0
    if (p_div + p_int + p_growth) <= 0
      return { years_sustained: 0, years_until_capital_gone: 0 }
    end

    horizon = [ max_years - goal_year_offset, 0 ].max
    return { years_sustained: 0, years_until_capital_gone: 0 } if horizon == 0

    swr_rate = 0.04
    swr_base = swr_rate * (p_div + p_int + p_growth)
    years_sustained = horizon
    years_until_capital_gone = nil
    loss_recorded = false

    horizon.times do |k|
      p_growth = p_growth * (1 + g)

      required = obj_real * 12 * ((1 + infl)**(goal_year_offset + k + 1))
      current_passive = p_div * y_div + p_int * y_int
      shortfall = required - current_passive
      available = p_growth + p_div + p_int
      swr_cap = swr_base * ((1 + infl)**k)

      sale = shortfall.positive? ? [ shortfall, swr_cap, available ].min : 0.0

      if sale < shortfall && !loss_recorded
        years_sustained = k
        loss_recorded = true
      end

      if sale.positive?
        if p_growth >= sale
          p_growth -= sale
        else
          remaining = sale - p_growth
          p_growth = 0.0
          tot_other = p_div + p_int
          if tot_other.positive?
            ratio = [ remaining / tot_other, 1.0 ].min
            p_div *= (1 - ratio)
            p_int *= (1 - ratio)
          end
        end
      end

      total = p_div + p_int + p_growth
      if total <= 1e-6 && years_until_capital_gone.nil?
        years_until_capital_gone = k + 1
      end

      break if !years_until_capital_gone.nil? && current_passive <= 1e-6
    end

    { years_sustained: years_sustained, years_until_capital_gone: years_until_capital_gone }
  end

  def self.cache_key(user)
    [ "motivation_projection", user.id ]
  end
end
