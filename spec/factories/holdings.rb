FactoryBot.define do
  factory :holding do
    user
    stock
    quantity { 10 }
    average_price { 100.00 }
  end
end
