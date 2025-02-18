class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :stock

  enum :transaction_type, { buy: "buy", sell: "sell" }

  validates :transaction_type, presence: true
  validates :quantity, presence: true
  validates :price, presence: true
end
