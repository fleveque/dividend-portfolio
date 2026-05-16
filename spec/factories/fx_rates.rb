FactoryBot.define do
  factory :fx_rate do
    base { "EUR" }
    quote { "USD" }
    rate { 1.10 }
    fetched_at { Time.current }
  end
end
