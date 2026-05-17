class DropTransactions < ActiveRecord::Migration[8.0]
  # Transactions was scaffolded early but never wired into any flow — the table
  # has stayed empty, so dropping it is safe. Kept reversible in case we ever
  # want to revisit a buy/sell ledger.
  def change
    drop_table :transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :stock, null: false, foreign_key: true
      t.string :transaction_type
      t.integer :quantity
      t.decimal :price, precision: 10, scale: 2
      t.timestamps
    end
  end
end
