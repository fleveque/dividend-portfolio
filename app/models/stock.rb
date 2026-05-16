class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_many :holdings
  has_many :radar_stocks, dependent: :destroy
  has_many :radars, through: :radar_stocks

  PAYMENT_FREQUENCIES = %w[monthly quarterly semi_annual annual].freeze
  # ISO 4217 code → display symbol. Unknown codes fall back to "<code> " in #currency_symbol
  # so users still see *something* (and the API still emits the raw code).
  CURRENCY_SYMBOLS = {
    "USD" => "$", "EUR" => "€", "GBP" => "£", "JPY" => "¥",
    "CHF" => "CHF ", "CAD" => "C$", "AUD" => "A$"
  }.freeze

  validates :symbol, presence: true, uniqueness: true
  validates :currency, presence: true
  validates :payment_frequency, inclusion: { in: PAYMENT_FREQUENCIES }, allow_nil: true
  validate :payment_months_format

  def currency_symbol
    CURRENCY_SYMBOLS[currency] || "#{currency} "
  end

  def self.last_added(limit = 10)
    order(created_at: :desc).limit(limit)
  end

  def self.top_scored(limit = 10)
    where.not(price: nil).filter_map do |stock|
      decorated = StockDecorator.new(stock)
      [ stock, decorated.dividend_score ] if decorated.dividend_score >= 5 && decorated.dividend_score_label.present?
    end.group_by { |_, score| score }
      .sort_by { |score, _| -score }
      .flat_map { |_, group| group.shuffle }
      .first(limit)
      .map(&:first)
  end

  private

  def payment_months_format
    return if payment_months.blank?
    return if payment_months.is_a?(Array) && payment_months.all? { |m| m.is_a?(Integer) && (1..12).cover?(m) }

    errors.add(:payment_months, "must be an array of integers between 1 and 12")
  end
end
