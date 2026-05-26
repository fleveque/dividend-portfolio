class AddMotivationFieldsToUsers < ActiveRecord::Migration[8.0]
  # Path to Freedom inputs. All nullable — users can fill them in
  # progressively from the /freedom page. Inflation gets a sensible
  # default so the projection works even before the user touches it.
  def change
    add_column :users, :motivation_monthly_invest,      :decimal, precision: 12, scale: 2
    add_column :users, :motivation_monthly_objective,   :decimal, precision: 12, scale: 2
    add_column :users, :motivation_inflation_pct,       :decimal, precision: 5,  scale: 2, default: 2.5
    add_column :users, :motivation_yield_override_pct,  :decimal, precision: 5,  scale: 2
  end
end
