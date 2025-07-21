class RadarStock < ApplicationRecord
  self.table_name = "radars_stocks"
  self.primary_key = [ :radar_id, :stock_id ]

  belongs_to :radar
  belongs_to :stock
end
