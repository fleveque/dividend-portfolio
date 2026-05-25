class AddNotifiedBelowTargetAtToRadarStocks < ActiveRecord::Migration[8.0]
  def change
    # Tracks the last time the daily digest told this user that this stock
    # is below their target. Used to throttle "below target" alerts to at
    # most once per ALERT_THROTTLE window (see Telegram::DailyDigest),
    # and cleared when the stock crosses back above target.
    add_column :radar_stocks, :notified_below_target_at, :datetime
  end
end
