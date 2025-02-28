class AddTargetPriceToRadarsStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :radars_stocks, :target_price, :decimal
  end
end
