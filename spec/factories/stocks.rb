FactoryBot.define do
  factory :stock do
    sequence(:symbol) { |n| "STOCK#{n}" }
    name { "Stock Name" }
    price { 100.00 }
  end
end
