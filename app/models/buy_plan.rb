class BuyPlan < ApplicationRecord
  belongs_to :user
  has_many :buy_plan_items, dependent: :destroy
  has_many :stocks, through: :buy_plan_items
end
