class Radar < ApplicationRecord
  belongs_to :user
  has_many :radar_stocks, dependent: :destroy
  has_many :stocks, through: :radar_stocks

  def self.most_added_stocks(limit = 10)
    Stock.joins(:radar_stocks)
         .group("stocks.id")
         .order("COUNT(radars_stocks.radar_id) DESC")
         .limit(limit)
  end

  def sorted_stocks
    stocks_with_targets = Stock.joins("INNER JOIN radars_stocks ON stocks.id = radars_stocks.stock_id")
                               .select("stocks.*, radars_stocks.target_price")
                               .where("radars_stocks.radar_id = ?", id)
    StockSorter.new(stocks_with_targets).sort
  end
end
