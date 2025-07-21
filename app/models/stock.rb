class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_many :radar_stocks, dependent: :destroy
  has_many :radars, through: :radar_stocks

  validates :symbol, presence: true, uniqueness: true
  validates :name, presence: true

  def self.last_added(limit = 10)
    order(created_at: :desc).limit(limit)
  end
end
