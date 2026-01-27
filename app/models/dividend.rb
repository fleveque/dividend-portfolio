class Dividend < ApplicationRecord
  belongs_to :user
  belongs_to :stock

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
end
