class Radar < ApplicationRecord
  belongs_to :user
  has_and_belongs_to_many :stocks

  def self.most_added_stocks(limit = 10)
    Stock.joins(:radars)
         .group("stocks.id")
         .order("COUNT(radars.id) DESC")
         .limit(limit)
  end
end
