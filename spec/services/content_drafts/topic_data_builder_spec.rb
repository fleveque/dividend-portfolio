require 'rails_helper'

RSpec.describe ContentDrafts::TopicDataBuilder do
  describe '.build (stock_of_the_day)' do
    let!(:stock) do
      create(:stock,
             symbol: "AAPL",
             name: "Apple Inc.",
             currency: "USD",
             price: 175.0,
             dividend_yield: 0.6,
             payout_ratio: 15.0,
             ex_dividend_date: Date.current + 3.days,
             payment_frequency: "quarterly",
             payment_months: [ 2, 5, 8, 11 ])
    end

    it 'returns a hash with the stock fields' do
      result = described_class.build("stock_of_the_day", "AAPL")

      expect(result[:symbol]).to eq("AAPL")
      expect(result[:name]).to eq("Apple Inc.")
      expect(result[:price]).to eq(175.0)
      expect(result[:payment_frequency]).to eq("quarterly")
      expect(result[:dividend_yield]).to eq(0.6)
      expect(result[:ex_dividend_date]).to eq((Date.current + 3.days).iso8601)
    end

    it 'returns nil for an unknown symbol' do
      expect(described_class.build("stock_of_the_day", "MADEUP")).to be_nil
    end

    it 'returns nil if the stock has no price yet' do
      stock.update!(price: nil)
      expect(described_class.build("stock_of_the_day", "AAPL")).to be_nil
    end
  end

  describe '.build (dividend_calendar)' do
    it 'returns nil when nothing is upcoming in the next 7 days' do
      create(:stock, symbol: "X", price: 10.0, ex_dividend_date: 30.days.from_now)
      expect(described_class.build("dividend_calendar", "2026-W21")).to be_nil
    end

    it 'returns a roundup with up to 8 stocks ordered by ex-div date' do
      create(:stock, symbol: "A", price: 10.0, ex_dividend_date: 1.day.from_now, dividend_yield: 2.0, payment_frequency: "quarterly")
      create(:stock, symbol: "B", price: 20.0, ex_dividend_date: 3.days.from_now, dividend_yield: 4.0, payment_frequency: "annual")

      result = described_class.build("dividend_calendar", "2026-W21")

      expect(result[:count]).to eq(2)
      expect(result[:stocks].map { |s| s[:symbol] }).to eq(%w[A B])
      expect(result[:earliest_date]).to eq(1.day.from_now.to_date.iso8601)
    end
  end

  describe '.build (pulse_aggregates)' do
    let!(:opt_in_users) { 5.times.map { create(:user, portfolio_slug: SecureRandom.uuid[0, 20]) } }
    let!(:stock_a) { create(:stock, symbol: "AAA", price: 100.0, dividend_yield: 2.0, payment_frequency: "quarterly") }
    let!(:stock_b) { create(:stock, symbol: "BBB", price: 50.0, dividend_yield: 4.0, payment_frequency: "quarterly") }

    before do
      opt_in_users.each { |u| create(:holding, user: u, stock: stock_a, quantity: 10, average_price: 90) }
      create(:holding, user: opt_in_users.first, stock: stock_b, quantity: 5, average_price: 45)
    end

    it 'returns the cohort metrics when the threshold is met' do
      result = described_class.build("pulse_aggregates", "2026-05")

      expect(result[:opt_in_count]).to eq(5)
      expect(result[:top_held_symbols]).to start_with("AAA") # AAA is in 5 portfolios, BBB only in 1
      expect(result[:avg_dividend_yield]).to be_a(Numeric)
      expect(result[:dominant_payment_frequency]).to eq("quarterly")
    end

    it 'returns nil when the opt-in cohort is below the threshold' do
      User.where.not(id: opt_in_users.first.id).update_all(portfolio_slug: nil)

      expect(described_class.build("pulse_aggregates", "2026-05")).to be_nil
    end

    it 'never includes user-identifying fields in the result' do
      result = described_class.build("pulse_aggregates", "2026-05")
      json = result.to_json
      opt_in_users.each do |u|
        expect(json).not_to include(u.email_address)
        expect(json).not_to include(u.portfolio_slug)
      end
    end
  end

  describe '.build (feature_announcement)' do
    it 'echoes the operator-supplied fields' do
      result = described_class.build(
        "feature_announcement",
        "multi-currency",
        extras: { feature_name: "Multi Currency", description: "Convert any portfolio.", audience: "investors" }
      )
      expect(result[:slug]).to eq("multi-currency")
      expect(result[:feature_name]).to eq("Multi Currency")
      expect(result[:audience]).to eq("investors")
    end

    it 'returns nil when description is missing' do
      result = described_class.build(
        "feature_announcement", "x",
        extras: { feature_name: "X", description: "" }
      )
      expect(result).to be_nil
    end
  end

  describe '.pulse_cohort_meets_threshold?' do
    it 'returns true when opt-in user count >= MIN_COHORT' do
      described_class::MIN_COHORT.times { create(:user, portfolio_slug: SecureRandom.uuid[0, 20]) }
      expect(described_class.pulse_cohort_meets_threshold?).to be true
    end

    it 'returns false when below MIN_COHORT' do
      (described_class::MIN_COHORT - 1).times { create(:user, portfolio_slug: SecureRandom.uuid[0, 20]) }
      expect(described_class.pulse_cohort_meets_threshold?).to be false
    end
  end
end
