class AddForeignKeysToRadarsStocks < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :radars_stocks, :radars, on_delete: :cascade
    add_foreign_key :radars_stocks, :stocks, on_delete: :cascade
  end
end
