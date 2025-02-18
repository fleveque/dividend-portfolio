class Stock < ApplicationRecord
  has_many :transactions
  has_many :dividends
  has_and_belongs_to_many :radars
end
