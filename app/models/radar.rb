class Radar < ApplicationRecord
  belongs_to :user
  has_and_belongs_to_many :stocks

  def self.most_added_stocks(limit = 10)
    Stock.joins(:radars)
         .group("stocks.id")
         .order("COUNT(radars.id) DESC")
         .limit(limit)
  end

  def sorted_stocks
    stocks.joins(:radars_stocks)
          .select("stocks.*, radars_stocks.target_price")
          .sort_by { |stock| percentage_difference(stock) }
  end

  def percentage_difference(stock)
    return nil unless stock.target_price

    ((stock.current_price - stock.target_price) / stock.target_price).abs * 100
  end
end
