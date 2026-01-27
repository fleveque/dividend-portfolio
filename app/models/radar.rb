class Radar < ApplicationRecord
  belongs_to :user
  has_many :radar_stocks, dependent: :destroy
  has_many :stocks, through: :radar_stocks

  def self.most_added_stocks(limit = 10)
    Stock.joins(:radar_stocks)
         .group("stocks.id")
         .order("COUNT(radar_stocks.radar_id) DESC")
         .limit(limit)
  end

  def sorted_stocks
    stocks_with_targets = stocks.select("stocks.*, radar_stocks.target_price")
    StockSorter.new(stocks_with_targets).sort
  end
end
