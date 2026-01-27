FactoryBot.define do
  factory :dividend do
    association :user
    association :stock
    amount { 9.99 }
    date { Date.current }
  end
end
