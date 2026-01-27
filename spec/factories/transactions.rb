FactoryBot.define do
  factory :transaction do
    association :user
    association :stock
    transaction_type { "buy" }
    quantity { 1 }
    price { 9.99 }
  end
end
