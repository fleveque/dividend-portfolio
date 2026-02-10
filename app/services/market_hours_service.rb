class MarketHoursService
  MARKET_TIMEZONE = "Eastern Time (US & Canada)"
  MARKET_OPEN = { hour: 9, min: 30 }.freeze
  MARKET_CLOSE = { hour: 16, min: 0 }.freeze

  def self.market_open?(time = Time.current)
    et = time.in_time_zone(MARKET_TIMEZONE)

    return false unless (1..5).cover?(et.wday)

    market_open = et.change(hour: MARKET_OPEN[:hour], min: MARKET_OPEN[:min], sec: 0, usec: 0)
    market_close = et.change(hour: MARKET_CLOSE[:hour], min: MARKET_CLOSE[:min], sec: 0, usec: 0)

    et >= market_open && et < market_close
  end
end
