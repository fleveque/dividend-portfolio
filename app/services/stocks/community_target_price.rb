module Stocks
  # Aggregates the *other* users' target prices for a set of stocks.
  #
  # Returns `{ stock_id => { count: Integer, average: Float|nil } }`.
  # `average` is suppressed (nil) below MIN_COHORT so we don't leak any
  # individual user's target and so the value reflects a meaningful group.
  # The requesting radar is always excluded from both count and average.
  class CommunityTargetPrice
    MIN_COHORT = 3

    def self.call(stock_ids:, exclude_radar_id:)
      return {} if stock_ids.blank?

      rows = RadarStock
        .where(stock_id: stock_ids)
        .where.not(target_price: nil)
        .where.not(radar_id: exclude_radar_id)
        .group(:stock_id)
        .pluck(:stock_id, Arel.sql("COUNT(*)"), Arel.sql("AVG(target_price)"))

      rows.each_with_object({}) do |(stock_id, count, avg), h|
        h[stock_id] = {
          count: count.to_i,
          average: count.to_i >= MIN_COHORT ? avg.to_f.round(2) : nil
        }
      end
    end
  end
end
