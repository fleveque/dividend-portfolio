class AddPulseShareTogglesToUsers < ActiveRecord::Migration[8.0]
  # `share_portfolio` defaults to true so anyone currently sharing keeps
  # sharing seamlessly across the deploy. `share_radar` defaults to false
  # — opt-in surface; users must explicitly enable it via Settings.
  def change
    add_column :users, :share_portfolio, :boolean, null: false, default: true
    add_column :users, :share_radar, :boolean, null: false, default: false
  end
end
