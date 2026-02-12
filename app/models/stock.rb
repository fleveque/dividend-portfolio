class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_many :radar_stocks, dependent: :destroy
  has_many :radars, through: :radar_stocks

  PAYMENT_FREQUENCIES = %w[monthly quarterly semi_annual annual].freeze

  validates :symbol, presence: true, uniqueness: true
  validates :payment_frequency, inclusion: { in: PAYMENT_FREQUENCIES }, allow_nil: true

  def self.last_added(limit = 10)
    order(created_at: :desc).limit(limit)
  end
end
