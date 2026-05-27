class AddMotivationCapitalPoolsToUsers < ActiveRecord::Migration[8.0]
  # Optional non-dividend capital pools for the /freedom projection:
  #   - interest_capital: bonds, real estate, bank accounts; pays a rate
  #   - growth_capital:   index funds, growth stocks; no recurrent income
  #
  # reinvest_interest controls whether the interest pool compounds during
  # accumulation (true) or pays out as income that counts toward the goal
  # (false). Defaults to true — matches the dividend-pool behaviour and
  # keeps the goal definition tight on actual passive income.
  def change
    add_column :users, :motivation_interest_capital,    :decimal, precision: 14, scale: 2
    add_column :users, :motivation_interest_rate_pct,   :decimal, precision: 5,  scale: 2
    add_column :users, :motivation_growth_capital,      :decimal, precision: 14, scale: 2
    add_column :users, :motivation_growth_rate_pct,     :decimal, precision: 5,  scale: 2
    add_column :users, :motivation_reinvest_interest,   :boolean, null: false, default: true
  end
end
