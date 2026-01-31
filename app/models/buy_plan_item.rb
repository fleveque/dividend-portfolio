class BuyPlanItem < ApplicationRecord
  belongs_to :buy_plan
  belongs_to :stock

  validates :quantity, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :stock_id, uniqueness: { scope: :buy_plan_id }
end
