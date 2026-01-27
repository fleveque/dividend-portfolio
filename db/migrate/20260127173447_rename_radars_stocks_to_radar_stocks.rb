class RenameRadarsStocksToRadarStocks < ActiveRecord::Migration[8.0]
  def change
    rename_table :radars_stocks, :radar_stocks
  end
end
