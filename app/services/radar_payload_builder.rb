module RadarPayloadBuilder
  module_function

  # Pulse-side schema is fixed at v1 for now. We include enough stock
  # metadata (price, dividend_yield, MA200, 52w range) that Pulse can
  # render a standalone radar page even if the user isn't also sharing
  # their portfolio — no NATS-based stock backfill in this first cut.
  PAYLOAD_VERSION = 1

  def call(user)
    {
      version: PAYLOAD_VERSION,
      slug: user.portfolio_slug,
      base_currency: user.preferred_currency || "USD",
      stocks: serialize_stocks(user)
    }
  end

  def serialize_stocks(user)
    radar = user.radar
    return [] unless radar

    radar.radar_stocks.includes(:stock).map do |rs|
      stock = rs.stock
      {
        symbol: stock.symbol,
        name: stock.name,
        currency: stock.currency,
        sector: stock.sector,
        price: stock.price&.to_f,
        target_price: rs.target_price&.to_f,
        dividend_yield: stock.dividend_yield&.to_f,
        fifty_two_week_high: stock.fifty_two_week_high&.to_f,
        fifty_two_week_low: stock.fifty_two_week_low&.to_f,
        ma_200: stock.ma_200&.to_f
      }
    end
  end
end
