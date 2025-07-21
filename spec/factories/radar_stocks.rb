FactoryBot.define do
  factory :radar_stock do
    association :radar
    association :stock
    target_price { 100.00 }

    trait :without_target_price do
      target_price { nil }
    end

    trait :with_high_target do
      target_price { 200.00 }
    end

    trait :with_low_target do
      target_price { 50.00 }
    end
  end
end
