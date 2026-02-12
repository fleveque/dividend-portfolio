class AddShiftedPaymentMonthsToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :shifted_payment_months, :json
  end
end
