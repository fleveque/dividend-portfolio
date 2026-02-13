FactoryBot.define do
  factory :stock do
    sequence(:symbol) { |n| "STOCK#{n}" }
    name { "Stock Name" }
    price { 100.00 }

    trait :with_dividend_schedule do
      dividend { 1.00 }
      dividend_yield { 2.50 }
      ex_dividend_date { Date.new(2024, 3, 15) }
      payment_frequency { "quarterly" }
      payment_months { [ 3, 6, 9, 12 ] }
      shifted_payment_months { [] }
    end

    trait :with_52_week_range do
      fifty_two_week_high { 200.00 }
      fifty_two_week_low { 80.00 }
    end
  end
end
