class AddPreferredCurrencyToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :preferred_currency, :string, default: "USD", null: false
  end
end
