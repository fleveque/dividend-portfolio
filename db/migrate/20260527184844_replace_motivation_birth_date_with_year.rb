class ReplaceMotivationBirthDateWithYear < ActiveRecord::Migration[8.0]
  # Swap the brief-lived `motivation_birth_date` (date) for the simpler
  # `motivation_birth_year` (integer). Birth year is precise enough to
  # render an "age at this point in the timeline" row on the /freedom
  # X-axis (off by ±1), and a number input reads nicer than a date
  # picker for an optional field.
  def change
    remove_column :users, :motivation_birth_date, :date
    add_column :users, :motivation_birth_year, :integer
  end
end
