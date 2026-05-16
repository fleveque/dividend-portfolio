FactoryBot.define do
  factory :user do
    sequence(:email_address) { |n| "user#{n}@example.com" }
    password { 'password123' }
    password_confirmation { 'password123' }

    trait :admin do
      admin { true }
    end

    trait :eur_user do
      preferred_currency { "EUR" }
    end
  end
end
