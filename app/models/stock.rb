class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_and_belongs_to_many :radars

  validates :symbol, presence: true, uniqueness: true

  def self.last_added(limit = 10)
    order(created_at: :desc).limit(limit)
  end
end
