class CreateAiRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.string :feature, null: false
      t.string :provider, null: false
      t.datetime :created_at, null: false
    end

    # Hot path: counting a user's calls since the start of the day.
    add_index :ai_requests, [ :user_id, :created_at ]
  end
end
