class CreateFxRates < ActiveRecord::Migration[8.0]
  def change
    create_table :fx_rates do |t|
      t.string :base, null: false
      t.string :quote, null: false
      t.decimal :rate, precision: 18, scale: 8, null: false
      t.datetime :fetched_at, null: false

      t.timestamps
    end
    add_index :fx_rates, [ :base, :quote ], unique: true
  end
end
