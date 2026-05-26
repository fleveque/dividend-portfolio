class PortfolioStatsService
  UNKNOWN_SECTOR = "Unknown".freeze

  # Returns the portfolio-stats payload for a user, or nil for an empty portfolio.
  # Shape:
  #   {
  #     byCurrency: { "USD" => { yoc: 3.2, currentYield: 2.8 }, "EUR" => {...} },
  #     displayCurrency: "USD",
  #     displayMarketValue: 12345.67, # nil if any FX missing
  #     displayYoc: 3.0,              # nil if any FX missing
  #     displayCurrentYield: 2.6,     # nil if any FX missing
  #     sectors: [
  #       { sector: "Technology", value: 12300.45, percent: 42.1 },
  #       ...
  #     ]                            # [] when no sector data or FX missing
  #   }
  def self.call(user)
    holdings = user.holdings.includes(:stock).to_a
    return nil if holdings.empty?

    new(user, holdings).call
  end

  def initialize(user, holdings)
    @user = user
    @holdings = holdings
    @preferred = user.preferred_currency || "USD"
  end

  def call
    by_currency = compute_by_currency
    display = compute_display_aggregates

    {
      byCurrency: by_currency,
      displayCurrency: @preferred,
      displayMarketValue: display[:market_value],
      displayYoc: display[:yoc],
      displayCurrentYield: display[:current_yield],
      sectors: compute_sectors
    }
  end

  private

  attr_reader :user, :holdings, :preferred

  def compute_by_currency
    grouped = holdings.group_by { |h| h.stock.currency || "USD" }
    grouped.transform_values do |hs|
      annual_income = hs.sum { |h| holding_annual_income(h) }
      cost_basis    = hs.sum { |h| holding_cost_basis(h) }
      market_value  = hs.sum { |h| holding_market_value(h) }

      {
        yoc: percentage(annual_income, cost_basis),
        currentYield: percentage(annual_income, market_value)
      }
    end
  end

  def compute_display_aggregates
    converted_income = 0.0
    converted_cost = 0.0
    converted_value = 0.0

    holdings.each do |h|
      from = h.stock.currency || "USD"
      income = FxRateService.convert(holding_annual_income(h), from: from, to: preferred)
      cost   = FxRateService.convert(holding_cost_basis(h), from: from, to: preferred)
      value  = FxRateService.convert(holding_market_value(h), from: from, to: preferred)

      return { market_value: nil, yoc: nil, current_yield: nil } if income.nil? || cost.nil? || value.nil?

      converted_income += income.to_f
      converted_cost   += cost.to_f
      converted_value  += value.to_f
    end

    {
      market_value: converted_value.round(2),
      yoc: percentage(converted_income, converted_cost),
      current_yield: percentage(converted_income, converted_value)
    }
  end

  def compute_sectors
    return [] unless holdings.any? { |h| h.stock.sector.present? }

    grouped = holdings.group_by { |h| h.stock.sector.presence || UNKNOWN_SECTOR }

    converted = grouped.transform_values do |hs|
      hs.sum do |h|
        from = h.stock.currency || "USD"
        v = FxRateService.convert(holding_market_value(h), from: from, to: preferred)
        return [] if v.nil? # any FX miss → skip the whole section

        v.to_f
      end
    end

    total = converted.values.sum
    return [] if total.zero?

    converted
      .sort_by { |_, v| -v }
      .map { |sector, value| { sector: sector, value: value.round(2), percent: (value / total * 100).round(1) } }
  end

  def holding_annual_income(holding)
    return 0.0 unless holding.stock.dividend

    holding.stock.dividend.to_f * holding.quantity.to_f
  end

  def holding_cost_basis(holding)
    holding.average_price.to_f * holding.quantity.to_f
  end

  def holding_market_value(holding)
    (holding.stock.price || 0).to_f * holding.quantity.to_f
  end

  def percentage(numerator, denominator)
    return 0.0 if denominator.zero?

    (numerator / denominator * 100).round(2)
  end
end
