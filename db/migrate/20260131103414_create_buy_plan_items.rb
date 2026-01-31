class CreateBuyPlanItems < ActiveRecord::Migration[8.0]
  def change
    create_table :buy_plan_items do |t|
      t.references :buy_plan, null: false, foreign_key: true
      t.references :stock, null: false, foreign_key: true
      t.integer :quantity, null: false, default: 1
      t.timestamps
    end

    add_index :buy_plan_items, [ :buy_plan_id, :stock_id ], unique: true
  end
end
