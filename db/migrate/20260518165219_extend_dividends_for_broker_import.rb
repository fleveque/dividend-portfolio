class ExtendDividendsForBrokerImport < ActiveRecord::Migration[8.0]
  # Adds the fields needed to import broker statements (IBKR first).
  # - quantity: # shares the payment was based on (derived from amount/per_share)
  # - per_share_amount: cash dividend per share
  # - currency: native currency of the payment (ISO 4217)
  # - withholding_tax: net tax withheld at source (always >= 0 stored as positive)
  # - source: 'manual' or 'ibkr' — protects manual rows from re-import overwrites
  def change
    change_table :dividends do |t|
      t.integer :quantity
      t.decimal :per_share_amount, precision: 12, scale: 6
      t.string :currency, default: "USD", null: false
      t.decimal :withholding_tax, precision: 12, scale: 4, default: 0, null: false
      t.string :source, default: "manual", null: false
    end

    add_index :dividends, [ :user_id, :stock_id, :date, :per_share_amount, :source ],
              unique: true,
              name: "index_dividends_on_dedup_key",
              where: "per_share_amount IS NOT NULL"
  end
end
