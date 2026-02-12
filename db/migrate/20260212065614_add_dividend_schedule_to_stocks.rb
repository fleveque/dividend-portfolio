class AddDividendScheduleToStocks < ActiveRecord::Migration[8.0]
  def change
    add_column :stocks, :ex_dividend_date, :date
    add_column :stocks, :payment_frequency, :string
  end
end
