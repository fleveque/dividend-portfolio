class RadarStock < ApplicationRecord
  self.table_name = "radars_stocks"
  self.primary_key = [ :radar_id, :stock_id ]

  belongs_to :radar
  belongs_to :stock

  validates :radar, presence: true
  validates :stock, presence: true
  validates :stock_id, uniqueness: { scope: :radar_id }
  validates :target_price, numericality: { greater_than: 0 }, allow_nil: true

  scope :with_target_price, -> { where.not(target_price: nil) }
  scope :without_target_price, -> { where(target_price: nil) }
end
