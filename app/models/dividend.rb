class Dividend < ApplicationRecord
  SOURCES = %w[manual ibkr].freeze

  belongs_to :user
  belongs_to :stock

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :currency, presence: true
  validates :source, presence: true, inclusion: { in: SOURCES }
  validates :withholding_tax, numericality: { greater_than_or_equal_to: 0 }
  validates :per_share_amount, numericality: { greater_than: 0 }, allow_nil: true
  validates :quantity, numericality: { greater_than: 0, only_integer: true }, allow_nil: true

  scope :manual, -> { where(source: "manual") }
  scope :imported, -> { where.not(source: "manual") }
  scope :ordered, -> { order(date: :desc, id: :desc) }

  # Net cash to the user after withholding tax. Use #net when displaying
  # 'what actually landed in my account' figures.
  def net
    (amount || 0) - (withholding_tax || 0)
  end
end
