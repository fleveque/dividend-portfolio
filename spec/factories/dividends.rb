FactoryBot.define do
  factory :dividend do
    association :user
    association :stock
    amount { 9.99 }
    date { Date.current }
    currency { "USD" }
    source { "manual" }
    withholding_tax { 0 }

    trait :ibkr do
      source { "ibkr" }
      per_share_amount { 0.5 }
      quantity { 20 }
      amount { 10.0 }
      withholding_tax { 1.5 }
    end
  end
end
