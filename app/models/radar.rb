class Radar < ApplicationRecord
  belongs_to :user
  has_many :radar_stocks
  has_many :stocks, through: :radar_stocks

  def self.most_added_stocks(limit = 10)
    Stock.joins(:radars)
         .group("stocks.id")
         .order("COUNT(radars.id) DESC")
         .limit(limit)
  end

  def sorted_stocks
    Stock.joins("INNER JOIN radars_stocks ON stocks.id = radars_stocks.stock_id")
         .select("stocks.*, radars_stocks.target_price")
         .where("radars_stocks.radar_id = ?", id)
         .sort_by { |stock| percentage_difference(stock) || Float::INFINITY }
  end

  def percentage_difference(stock)
    return nil unless stock.target_price && stock.price

    ((stock.price - stock.target_price) / stock.target_price).abs * 100
  end
end
