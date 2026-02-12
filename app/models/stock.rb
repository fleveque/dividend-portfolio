class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_many :radar_stocks, dependent: :destroy
  has_many :radars, through: :radar_stocks

  PAYMENT_FREQUENCIES = %w[monthly quarterly semi_annual annual].freeze

  validates :symbol, presence: true, uniqueness: true
  validates :payment_frequency, inclusion: { in: PAYMENT_FREQUENCIES }, allow_nil: true
  validate :payment_months_format

  def self.last_added(limit = 10)
    order(created_at: :desc).limit(limit)
  end

  private

  def payment_months_format
    return if payment_months.blank?
    return if payment_months.is_a?(Array) && payment_months.all? { |m| m.is_a?(Integer) && (1..12).cover?(m) }

    errors.add(:payment_months, "must be an array of integers between 1 and 12")
  end
end
