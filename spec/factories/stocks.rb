FactoryBot.define do
  factory :stock do
    symbol { 'AAPL' }
    price { 150.00 }
    name { 'Apple Inc.' }
  end
end
