class CreateDividends < ActiveRecord::Migration[8.0]
  def change
    create_table :dividends do |t|
      t.references :user, null: false, foreign_key: true
      t.references :stock, null: false, foreign_key: true
      t.decimal :amount
      t.date :date

      t.timestamps
    end
  end
end
