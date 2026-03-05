class AddPortfolioSlugToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :portfolio_slug, :string
    add_index :users, :portfolio_slug, unique: true
  end
end
