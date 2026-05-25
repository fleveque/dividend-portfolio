require "rails_helper"

RSpec.describe "RadarStock NATS publishing", type: :model do
  let(:stock) { create(:stock, symbol: "AAPL") }

  before { allow(NatsPublisher).to receive(:publish) }

  it "publishes radar.updated when a radar stock changes for an opted-in user" do
    user = create(:user, portfolio_slug: "alice", share_radar: true)
    radar = create(:radar, user: user)
    RadarStock.create!(radar: radar, stock: stock, target_price: 100)
    expect(NatsPublisher).to have_received(:publish).with("radar.updated", anything)
  end

  it "does not publish when the user has share_radar disabled" do
    user = create(:user, portfolio_slug: "alice", share_radar: false)
    radar = create(:radar, user: user)
    RadarStock.create!(radar: radar, stock: stock, target_price: 100)
    expect(NatsPublisher).not_to have_received(:publish).with("radar.updated", anything)
  end

  it "does not publish when the user has no slug" do
    user = create(:user, share_radar: true)
    radar = create(:radar, user: user)
    RadarStock.create!(radar: radar, stock: stock, target_price: 100)
    expect(NatsPublisher).not_to have_received(:publish).with("radar.updated", anything)
  end
end
