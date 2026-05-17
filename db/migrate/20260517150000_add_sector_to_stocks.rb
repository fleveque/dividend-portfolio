class AddSectorToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :sector, :string
    add_column :stocks, :industry, :string
  end
end
