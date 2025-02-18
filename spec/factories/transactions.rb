FactoryBot.define do
  factory :transaction do
    user { nil }
    stock { nil }
    transaction_type { "MyString" }
    quantity { 1 }
    price { "9.99" }
  end
end
