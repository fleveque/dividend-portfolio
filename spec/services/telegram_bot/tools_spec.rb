require "rails_helper"

RSpec.describe TelegramBot::Tools, type: :service do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", price: 150.0, currency: "USD", dividend: 1.0, dividend_yield: 0.5, payment_frequency: "quarterly", ex_dividend_date: 5.days.from_now) }

  describe "GetRadar" do
    it "returns an empty list when the user has no radar" do
      result = described_class::GetRadar.call(user: user)
      expect(result[:stocks]).to eq([])
    end

    it "serialises radar stocks with status vs target_price" do
      radar = create(:radar, user: user)
      RadarStock.create!(radar: radar, stock: stock, target_price: 140.0)
      result = described_class::GetRadar.call(user: user)
      expect(result[:stocks].first[:symbol]).to eq("AAPL")
      expect(result[:stocks].first[:status]).to eq("above_target") # 150 > 140
    end
  end

  describe "GetHoldings" do
    it "returns holdings with totals_by_currency" do
      create(:holding, user: user, stock: stock, quantity: 10, average_price: 100.0)
      result = described_class::GetHoldings.call(user: user)
      expect(result[:holdings].first[:symbol]).to eq("AAPL")
      expect(result[:totals_by_currency]["USD"][:value]).to eq(1500.0)
      expect(result[:totals_by_currency]["USD"][:gain_loss]).to eq(500.0)
    end
  end

  describe "GetDividendSummary" do
    it "totals dividends in the given period by currency" do
      create(:dividend, user: user, stock: stock, date: Date.current, amount: 50.0, currency: "USD", withholding_tax: 5.0)
      create(:dividend, user: user, stock: stock, date: Date.current, amount: 20.0, currency: "USD", withholding_tax: 2.0)
      result = described_class::GetDividendSummary.call(user: user, period: "this_month")
      expect(result[:currencies]["USD"][:gross]).to eq(70.0)
      expect(result[:currencies]["USD"][:net]).to eq(63.0)
      expect(result[:currencies]["USD"][:count]).to eq(2)
    end

    it "returns an error for an unknown period" do
      result = described_class::GetDividendSummary.call(user: user, period: "since_forever")
      expect(result[:error]).to match(/Unknown period/)
    end
  end

  describe "GetRecentDividends" do
    it "returns the most recent N capped at MAX" do
      30.times { |i| create(:dividend, user: user, stock: stock, date: i.days.ago, amount: 1.0, currency: "USD") }
      result = described_class::GetRecentDividends.call(user: user, limit: 100)
      expect(result[:dividends].length).to eq(described_class::GetRecentDividends::MAX)
    end
  end

  describe "GetUpcomingExDivs" do
    it "lists held + radar stocks with ex-div in the window" do
      radar = create(:radar, user: user)
      RadarStock.create!(radar: radar, stock: stock, target_price: 200.0)
      result = described_class::GetUpcomingExDivs.call(user: user, days: 7)
      expect(result[:stocks].first[:symbol]).to eq("AAPL")
      expect(result[:stocks].first[:on_radar]).to be(true)
    end
  end

  describe "GetStock" do
    it "returns the stock when found" do
      stock # touch
      result = described_class::GetStock.call(symbol: "aapl")
      expect(result[:found]).to be(true)
      expect(result[:symbol]).to eq("AAPL")
    end

    it "returns found=false when not in DB" do
      result = described_class::GetStock.call(symbol: "NOPE")
      expect(result[:found]).to be(false)
    end
  end
end
