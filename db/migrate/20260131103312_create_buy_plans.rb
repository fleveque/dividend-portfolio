class CreateBuyPlans < ActiveRecord::Migration[8.0]
  def change
    create_table :buy_plans do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.timestamps
    end
  end
end
