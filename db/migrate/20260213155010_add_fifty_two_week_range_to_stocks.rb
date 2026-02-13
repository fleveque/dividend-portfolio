class AddFiftyTwoWeekRangeToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :fifty_two_week_high, :decimal, precision: 10, scale: 2
    add_column :stocks, :fifty_two_week_low, :decimal, precision: 10, scale: 2
  end
end
