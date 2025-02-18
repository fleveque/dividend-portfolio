class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :transactions
  has_many :dividends
  has_one :radar
  has_many :stocks, through: :transactions

  normalizes :email_address, with: ->(e) { e.strip.downcase }
end
