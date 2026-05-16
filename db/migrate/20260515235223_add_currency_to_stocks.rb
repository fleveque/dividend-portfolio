class AddCurrencyToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :currency, :string, default: "USD", null: false
  end
end
