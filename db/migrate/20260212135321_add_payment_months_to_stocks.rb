class AddPaymentMonthsToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :payment_months, :json
  end
end
