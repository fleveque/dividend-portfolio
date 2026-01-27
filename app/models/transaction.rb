class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :stock

  enum :transaction_type, { buy: "buy", sell: "sell" }

  validates :transaction_type, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than: 0 }
end
