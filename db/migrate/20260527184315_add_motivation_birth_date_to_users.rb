class AddMotivationBirthDateToUsers < ActiveRecord::Migration[8.0]
  # Optional. Powers the secondary "age" row on the /freedom chart X-axis
  # so the timeline reads as a life chapter, not just relative years.
  def change
    add_column :users, :motivation_birth_date, :date
  end
end
