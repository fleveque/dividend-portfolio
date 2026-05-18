class AddIsinToStocks < ActiveRecord::Migration[8.0]
  # ISIN is a globally stable identifier (12 chars, e.g. US6541061031 for NKE).
  # Broker exports (IBKR, etc.) include it; we use it as the cross-broker match
  # key for dividend imports. Nullable + lazy-filled from imports so existing
  # rows aren't blocked.
  def change
    add_column :stocks, :isin, :string
    add_index :stocks, :isin, unique: true, where: "isin IS NOT NULL"
  end
end
