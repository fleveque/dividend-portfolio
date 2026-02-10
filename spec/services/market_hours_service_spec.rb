RSpec.describe MarketHoursService do
  describe ".market_open?" do
    let(:eastern) { ActiveSupport::TimeZone["Eastern Time (US & Canada)"] }

    context "during market hours" do
      it "returns true at market open" do
        time = eastern.local(2025, 1, 6, 9, 30) # Monday 9:30 AM ET
        expect(described_class.market_open?(time)).to be true
      end

      it "returns true during midday" do
        time = eastern.local(2025, 1, 6, 12, 0) # Monday noon ET
        expect(described_class.market_open?(time)).to be true
      end

      it "returns true one minute before close" do
        time = eastern.local(2025, 1, 6, 15, 59) # Monday 3:59 PM ET
        expect(described_class.market_open?(time)).to be true
      end
    end

    context "outside market hours" do
      it "returns false before market open" do
        time = eastern.local(2025, 1, 6, 9, 29) # Monday 9:29 AM ET
        expect(described_class.market_open?(time)).to be false
      end

      it "returns false at market close" do
        time = eastern.local(2025, 1, 6, 16, 0) # Monday 4:00 PM ET
        expect(described_class.market_open?(time)).to be false
      end

      it "returns false after market close" do
        time = eastern.local(2025, 1, 6, 17, 0) # Monday 5:00 PM ET
        expect(described_class.market_open?(time)).to be false
      end
    end

    context "on weekends" do
      it "returns false on Saturday" do
        time = eastern.local(2025, 1, 4, 12, 0) # Saturday noon ET
        expect(described_class.market_open?(time)).to be false
      end

      it "returns false on Sunday" do
        time = eastern.local(2025, 1, 5, 12, 0) # Sunday noon ET
        expect(described_class.market_open?(time)).to be false
      end
    end

    context "on weekdays" do
      it "returns true on Tuesday" do
        time = eastern.local(2025, 1, 7, 12, 0)
        expect(described_class.market_open?(time)).to be true
      end

      it "returns true on Friday" do
        time = eastern.local(2025, 1, 10, 12, 0)
        expect(described_class.market_open?(time)).to be true
      end
    end
  end
end
