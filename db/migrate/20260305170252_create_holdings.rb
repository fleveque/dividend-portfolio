class CreateHoldings < ActiveRecord::Migration[8.0]
  def change
    create_table :holdings do |t|
      t.references :user, null: false, foreign_key: true
      t.references :stock, null: false, foreign_key: true
      t.decimal :quantity, precision: 12, scale: 4, null: false
      t.decimal :average_price, precision: 10, scale: 2, null: false

      t.timestamps
    end
    add_index :holdings, [ :user_id, :stock_id ], unique: true
  end
end
