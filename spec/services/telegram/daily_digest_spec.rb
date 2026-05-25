require "rails_helper"

RSpec.describe Telegram::DailyDigest, type: :service do
  let(:user) { create(:user) }
  let(:stock) do
    create(:stock,
      symbol: "AAPL",
      price: 150,
      currency: "USD",
      dividend: 1.0,
      payment_frequency: "quarterly",
      ex_dividend_date: 3.days.from_now)
  end

  describe "ex-divs section" do
    it "includes held stocks with the expected per-payment amount" do
      create(:holding, user: user, stock: stock, quantity: 10, average_price: 100)
      msg = described_class.build(user: user)
      expect(msg).to include("Upcoming ex-dividend dates")
      expect(msg).to include("AAPL")
      expect(msg).to include("ex-div #{stock.ex_dividend_date.iso8601}")
    end

    it "includes radar-only stocks separately marked" do
      radar = create(:radar, user: user)
      RadarStock.create!(radar: radar, stock: stock, target_price: 200)
      msg = described_class.build(user: user)
      expect(msg).to include("AAPL (radar)")
    end
  end

  describe "dividends received section" do
    it "totals net amount per currency and lists each payment" do
      create(:dividend, user: user, stock: stock, date: 1.day.ago, amount: 25.0, currency: "USD", withholding_tax: 5.0)
      msg = described_class.build(user: user)
      expect(msg).to include("Dividends received yesterday")
      expect(msg).to include("Total: <b>20.0 USD</b>")
      expect(msg).to include("AAPL: 20.0 USD")
    end

    it "skips the section when there were no payments yesterday" do
      # Give the user a holding with an ex-div so the digest isn't empty;
      # only the dividends-received section should be missing.
      create(:holding, user: user, stock: stock, quantity: 10, average_price: 100)
      create(:dividend, user: user, stock: stock, date: 3.days.ago, amount: 25.0, currency: "USD", withholding_tax: 5.0)
      msg = described_class.build(user: user)
      expect(msg).to include("Upcoming ex-dividend dates")
      expect(msg).not_to include("Dividends received yesterday")
    end
  end

  describe "target hits section" do
    let(:radar) { create(:radar, user: user) }

    it "includes stocks currently below target and stamps notified_below_target_at" do
      rs = RadarStock.create!(radar: radar, stock: stock, target_price: 200)
      msg = described_class.build(user: user)
      expect(msg).to include("below your target price")
      expect(msg).to include("AAPL")
      expect(rs.reload.notified_below_target_at).to be_present
    end

    it "throttles repeat alerts to once per 7 days" do
      RadarStock.create!(radar: radar, stock: stock, target_price: 200, notified_below_target_at: 3.days.ago)
      msg = described_class.build(user: user)
      expect(msg).not_to include("below your target price")
    end

    it "re-alerts after 7 days" do
      RadarStock.create!(radar: radar, stock: stock, target_price: 200, notified_below_target_at: 8.days.ago)
      msg = described_class.build(user: user)
      expect(msg).to include("below your target price")
    end

    it "clears notified_below_target_at when stock climbs back above target" do
      rs = RadarStock.create!(radar: radar, stock: stock, target_price: 100, notified_below_target_at: 2.days.ago)
      described_class.build(user: user) # 150 >= 100 → reset
      expect(rs.reload.notified_below_target_at).to be_nil
    end
  end

  describe "empty digest" do
    it "returns nil when there's nothing to say" do
      # No holdings, no dividends, no radar — nothing for any section.
      msg = described_class.build(user: user)
      expect(msg).to be_nil
    end
  end

  describe "HTML formatting safety" do
    it "escapes stock symbols that contain angle brackets / ampersands" do
      weird_stock = create(:stock, symbol: "A&B<Co>", price: 10, currency: "USD",
                           dividend: 0.4, payment_frequency: "quarterly",
                           ex_dividend_date: 3.days.from_now)
      create(:holding, user: user, stock: weird_stock, quantity: 10, average_price: 5)
      msg = described_class.build(user: user)
      expect(msg).to include("A&amp;B&lt;Co&gt;")
      expect(msg).not_to include("A&B<Co>")
    end
  end
end
