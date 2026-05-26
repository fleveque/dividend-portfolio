require "rails_helper"

RSpec.describe Demos::DataBundle, type: :service do
  subject(:bundle) { described_class.call }

  describe "radar" do
    it "ships a mix of below-target and above-target stocks so the radar surfaces actionable cards" do
      stocks = bundle[:radar][:stocks]
      expect(stocks.any? { |s| s[:belowTarget] }).to be(true), "expected at least one below-target stock"
      expect(stocks.any? { |s| s[:aboveTarget] }).to be(true), "expected at least one above-target stock"
    end
  end

  describe "holdings" do
    it "includes a EUR-denominated position (REP.MC) so the dividend chart shows multiple currencies" do
      holdings = bundle[:holdings][:holdings]
      currencies = holdings.map { |h| h[:stock][:currency] }
      expect(currencies).to include("USD", "EUR")
      expect(holdings.any? { |h| h[:stock][:symbol] == "REP.MC" }).to be(true)
    end

    it "computes per-currency yield/cost totals for every currency held" do
      stats = bundle[:holdings][:portfolioStats]
      expect(stats[:byCurrency].keys).to include("USD", "EUR")
      stats[:byCurrency].each_value do |totals|
        expect(totals).to include(:yoc, :currentYield)
      end
    end
  end

  describe "dividend growth via DCA tranches" do
    it "produces smaller historical amounts than recent amounts for the same stock" do
      # KO accumulates from 40 shares (22mo ago) → 100 shares (10mo ago). Its
      # oldest dividend should be ~40% the size of its most recent one.
      ko_dividends = bundle[:dividends].select { |d| d[:symbol] == "KO" }.sort_by { |d| d[:date] }
      expect(ko_dividends.length).to be >= 2
      expect(ko_dividends.first[:amount]).to be < ko_dividends.last[:amount]
    end
  end

  describe "profile" do
    it "ships a demo profile with motivation inputs and a precomputed summary" do
      profile = bundle[:profile]
      expect(profile[:preferredCurrency]).to eq("USD")
      expect(profile[:motivationMonthlyInvest]).to be > 0
      expect(profile[:motivationMonthlyObjective]).to be > 0
      expect(profile[:motivationSummary]).to include(:years, :progressPct, :finalPortfolioReal)
      expect(profile[:motivationSummary][:currency]).to eq("USD")
    end
  end

  describe "chart projections" do
    it "fills future months with a projected number and leaves past months nil" do
      buckets = bundle[:chart][:byCurrency]["USD"]
      current_month = Date.current.strftime("%Y-%m")

      past = buckets.select { |b| b[:month] < current_month }
      future = buckets.select { |b| b[:month] > current_month }

      expect(past).not_to be_empty
      expect(future).not_to be_empty
      expect(past.map { |b| b[:projected] }.uniq).to eq([ nil ])
      expect(future.any? { |b| b[:projected].is_a?(Numeric) && b[:projected] > 0 }).to be(true)
    end

    it "ships chartFull spanning strictly more months than the default chart" do
      expect(bundle[:chartFull][:months].length).to be > bundle[:chart][:months].length
    end
  end
end
