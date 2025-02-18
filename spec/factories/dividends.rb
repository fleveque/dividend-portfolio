FactoryBot.define do
  factory :dividend do
    user { nil }
    stock { nil }
    amount { "9.99" }
    date { "2025-02-15" }
  end
end
