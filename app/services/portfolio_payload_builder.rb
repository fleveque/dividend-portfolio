module PortfolioPayloadBuilder
  module_function

  # v2 payload — pulse PR #29 reads version, base_currency, and the per-holding
  # currency / value_in_base / value_in_usd fields. Pulse's v1 fallback clause
  # still works for the legacy top-level holding fields (symbol/quantity/avg_price/
  # price), which we keep emitting for one release in case of a pulse rollback.
  PAYLOAD_VERSION = 2

  def call(user)
    base_currency = user.preferred_currency || "USD"
    {
      version: PAYLOAD_VERSION,
      slug: user.portfolio_slug,
      base_currency: base_currency,
      holdings: user.holdings.includes(:stock).map { |h| serialize_holding(h, base_currency) },
      stats: stats_for(user)
    }
  end

  # Pre-aggregated stats so Pulse doesn't have to redo the per-currency / FX
  # math in Elixir. nil when the portfolio is empty (PortfolioStatsService
  # short-circuits in that case).
  def stats_for(user)
    stats = PortfolioStatsService.call(user)
    return nil if stats.nil?

    {
      yoc: stats[:displayYoc],
      currentYield: stats[:displayCurrentYield],
      sectors: stats[:sectors]
    }
  end

  def serialize_holding(holding, base_currency)
    stock = holding.stock
    price = (stock.price || 0).to_f
    value_native = price * holding.quantity.to_f
    value_in_base = FxRateService.convert(value_native, from: stock.currency, to: base_currency)
    value_in_usd =
      if base_currency == "USD"
        value_in_base
      else
        FxRateService.convert(value_native, from: stock.currency, to: "USD")
      end

    {
      symbol: stock.symbol,
      currency: stock.currency,
      quantity: holding.quantity.to_f,
      avg_price: holding.average_price.to_f,
      price: price,
      value_in_base: value_in_base,
      value_in_usd: value_in_usd
    }
  end
end
