class AddMotivationStartYearToUsers < ActiveRecord::Migration[8.0]
  # Year the user started investing — used by /freedom to back-project the
  # chart so visitors see "where they came from" alongside the projection.
  def change
    add_column :users, :motivation_start_year, :integer
  end
end
