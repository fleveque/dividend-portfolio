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
    Stock.joins("INNER JOIN radars_stocks ON stocks.id = radars_stocks.stock_id")
         .select("stocks.*, radars_stocks.target_price")
         .where("radars_stocks.radar_id = ?", id)
         .sort_by { |stock| sort_priority(stock) }
  end

  private

  def sort_priority(stock)
    return 1 unless stock.target_price && stock.price # No target = middle priority

    diff = ((stock.price - stock.target_price) / stock.target_price) * 100

    if diff <= 0
      # Below or at target = good (lower number = higher priority)
      -diff.abs
    else
      # Above target = bad (higher number = lower priority)
      diff + 1000 # Add offset to ensure above-target stocks come last
    end
  end
end
