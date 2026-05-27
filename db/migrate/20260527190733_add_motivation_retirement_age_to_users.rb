class AddMotivationRetirementAgeToUsers < ActiveRecord::Migration[8.0]
  # Optional. When set together with motivation_birth_year, forces the
  # /freedom distribution phase to begin no later than the year the
  # user hits this age — even if the dividend goal hasn't been met.
  # Distribution then proceeds with whatever passive income exists at
  # that point, with capital sales topping up the inflation-adjusted
  # goal until capital runs out (or until acquisitive power is lost,
  # whichever comes first).
  def change
    add_column :users, :motivation_retirement_age, :integer
  end
end
