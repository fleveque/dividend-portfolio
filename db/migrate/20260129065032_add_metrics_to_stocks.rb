class AddMetricsToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :eps, :decimal, precision: 10, scale: 4
    add_column :stocks, :pe_ratio, :decimal, precision: 10, scale: 2
    add_column :stocks, :dividend, :decimal, precision: 10, scale: 4
    add_column :stocks, :dividend_yield, :decimal, precision: 10, scale: 4
    add_column :stocks, :payout_ratio, :decimal, precision: 10, scale: 4
    add_column :stocks, :ma_50, :decimal, precision: 10, scale: 2
    add_column :stocks, :ma_200, :decimal, precision: 10, scale: 2
  end
end
