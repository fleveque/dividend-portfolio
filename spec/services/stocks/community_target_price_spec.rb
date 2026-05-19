require "rails_helper"

RSpec.describe Stocks::CommunityTargetPrice do
  let(:stock) { create(:stock, symbol: "AAPL") }
  let(:requesting_user) { create(:user) }
  let(:requesting_radar) { create(:radar, user: requesting_user) }

  describe ".call" do
    it "returns an empty hash for an empty stock_ids list" do
      expect(described_class.call(stock_ids: [], exclude_radar_id: requesting_radar.id)).to eq({})
    end

    it "excludes the requesting radar from count and average" do
      RadarStock.create!(radar: requesting_radar, stock: stock, target_price: 100)
      # 3 other users so the cohort threshold is met
      3.times do |i|
        other = create(:user)
        other_radar = other.radar || create(:radar, user: other)
        RadarStock.create!(radar: other_radar, stock: stock, target_price: 150 + (i * 10))
      end

      result = described_class.call(stock_ids: [ stock.id ], exclude_radar_id: requesting_radar.id)
      expect(result[stock.id][:count]).to eq(3)
      # avg of 150, 160, 170 = 160.0
      expect(result[stock.id][:average]).to eq(160.0)
    end

    it "suppresses the average when count is below MIN_COHORT" do
      2.times do |i|
        other = create(:user)
        other_radar = other.radar || create(:radar, user: other)
        RadarStock.create!(radar: other_radar, stock: stock, target_price: 200 + i)
      end

      result = described_class.call(stock_ids: [ stock.id ], exclude_radar_id: requesting_radar.id)
      expect(result[stock.id][:count]).to eq(2)
      expect(result[stock.id][:average]).to be_nil
    end

    it "ignores radar_stocks with a nil target_price" do
      3.times do
        other = create(:user)
        other_radar = other.radar || create(:radar, user: other)
        RadarStock.create!(radar: other_radar, stock: stock, target_price: nil)
      end

      result = described_class.call(stock_ids: [ stock.id ], exclude_radar_id: requesting_radar.id)
      # All three rows had nil target_price → no aggregate row for this stock
      expect(result[stock.id]).to be_nil
    end

    it "rounds the average to two decimal places" do
      [ 100.333, 100.334, 100.335 ].each do |price|
        other = create(:user)
        other_radar = other.radar || create(:radar, user: other)
        RadarStock.create!(radar: other_radar, stock: stock, target_price: price)
      end

      result = described_class.call(stock_ids: [ stock.id ], exclude_radar_id: requesting_radar.id)
      expect(result[stock.id][:average]).to eq(100.33) # rounded half-to-even / banker's, but 100.334 rounds to 100.33
    end

    it "handles multiple stocks in a single query" do
      other_stock = create(:stock, symbol: "MSFT")
      3.times do |i|
        other = create(:user)
        other_radar = other.radar || create(:radar, user: other)
        RadarStock.create!(radar: other_radar, stock: stock, target_price: 100)
        RadarStock.create!(radar: other_radar, stock: other_stock, target_price: 300 + i)
      end

      result = described_class.call(stock_ids: [ stock.id, other_stock.id ], exclude_radar_id: requesting_radar.id)
      expect(result.keys).to contain_exactly(stock.id, other_stock.id)
      expect(result[stock.id][:average]).to eq(100.0)
      expect(result[other_stock.id][:average]).to eq(301.0)
    end
  end
end
