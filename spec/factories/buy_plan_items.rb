FactoryBot.define do
  factory :buy_plan_item do
    association :buy_plan
    association :stock
    quantity { 10 }

    trait :with_low_quantity do
      quantity { 1 }
    end

    trait :with_high_quantity do
      quantity { 100 }
    end
  end
end
