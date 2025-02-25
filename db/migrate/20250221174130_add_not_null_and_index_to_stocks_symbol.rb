class AddNotNullAndIndexToStocksSymbol < ActiveRecord::Migration[8.0]
  def change
    change_column_null :stocks, :symbol, false
    add_index :stocks, :symbol, unique: true
  end
end
