require "rails_helper"

RSpec.describe RadarPayloadBuilder, type: :service do
  let(:user) { create(:user, portfolio_slug: "alice", preferred_currency: "EUR") }
  let(:radar) { create(:radar, user: user) }

  it "returns the v1 payload shape with empty stocks when the user has no radar" do
    user_without_radar = create(:user, portfolio_slug: "bob")
    payload = described_class.call(user_without_radar)
    expect(payload).to include(version: 1, slug: "bob", stocks: [])
  end

  it "serialises each radar stock with target_price and the metadata Pulse needs" do
    stock = create(:stock,
      symbol: "AAPL", name: "Apple Inc.", currency: "USD", sector: "Technology",
      price: 178.50, dividend_yield: 0.56,
      fifty_two_week_high: 199.62, fifty_two_week_low: 164.08, ma_200: 168.40)
    RadarStock.create!(radar: radar, stock: stock, target_price: 160)

    payload = described_class.call(user)

    expect(payload[:version]).to eq(1)
    expect(payload[:slug]).to eq("alice")
    expect(payload[:base_currency]).to eq("EUR")
    expect(payload[:stocks].length).to eq(1)
    expect(payload[:stocks].first).to include(
      symbol: "AAPL",
      name: "Apple Inc.",
      currency: "USD",
      sector: "Technology",
      price: 178.50,
      target_price: 160.0,
      dividend_yield: 0.56,
      fifty_two_week_high: 199.62,
      fifty_two_week_low: 164.08,
      ma_200: 168.40
    )
  end
end
