require 'rails_helper'

RSpec.describe FxRateService do
  before do
    Rails.cache.clear
    allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).and_return(nil)
  end

  describe '.rate' do
    it 'returns 1.0 for identity pairs without hitting any layer' do
      expect(YahooFinanceClient::Stock).not_to receive(:get_fx_rate)
      expect(described_class.rate(from: "USD", to: "USD")).to eq(1.0)
    end

    it 'reads from Rails.cache when warm' do
      Rails.cache.write("fx/EURUSD", 1.10)
      expect(YahooFinanceClient::Stock).not_to receive(:get_fx_rate)
      expect(described_class.rate(from: "EUR", to: "USD")).to eq(1.10)
    end

    it 'falls back to a fresh DB row when cache is empty' do
      create(:fx_rate, base: "EUR", quote: "USD", rate: 1.10, fetched_at: 1.hour.ago)
      expect(YahooFinanceClient::Stock).not_to receive(:get_fx_rate)
      expect(described_class.rate(from: "EUR", to: "USD")).to eq(1.10)
    end

    it 'ignores stale DB rows and refetches from provider' do
      create(:fx_rate, base: "EUR", quote: "USD", rate: 1.05, fetched_at: 2.days.ago)
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).with("EUR", "USD").and_return(1.20)
      expect(described_class.rate(from: "EUR", to: "USD")).to eq(1.20)
    end

    it 'derives the inverse from a fresh forward DB row' do
      create(:fx_rate, base: "EUR", quote: "USD", rate: 1.25, fetched_at: 1.hour.ago)
      expect(YahooFinanceClient::Stock).not_to receive(:get_fx_rate)
      expect(described_class.rate(from: "USD", to: "EUR")).to be_within(0.0001).of(0.8)
    end

    it 'derives the inverse from a cached forward rate' do
      Rails.cache.write("fx/EURUSD", 2.0)
      expect(YahooFinanceClient::Stock).not_to receive(:get_fx_rate)
      expect(described_class.rate(from: "USD", to: "EUR")).to eq(0.5)
    end

    it 'fetches from the provider when nothing is cached or stored' do
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).with("GBP", "USD").and_return(1.27)
      expect(described_class.rate(from: "GBP", to: "USD")).to eq(1.27)
    end

    it 'persists the provider result to the DB' do
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).with("GBP", "USD").and_return(1.27)
      expect { described_class.rate(from: "GBP", to: "USD") }.to change(FxRate, :count).by(1)
    end

    it 'returns nil when the provider returns nil' do
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).and_return(nil)
      expect(described_class.rate(from: "XXX", to: "USD")).to be_nil
    end
  end

  describe '.convert' do
    it 'returns the amount unchanged for identity pairs' do
      expect(described_class.convert(100.0, from: "USD", to: "USD")).to eq(100.0)
    end

    it 'multiplies by the rate' do
      Rails.cache.write("fx/EURUSD", 1.10)
      expect(described_class.convert(100.0, from: "EUR", to: "USD")).to be_within(0.0001).of(110.0)
    end

    it 'returns nil when no rate is available' do
      expect(described_class.convert(100.0, from: "XXX", to: "USD")).to be_nil
    end
  end

  describe '.pairs_needed' do
    it 'returns the cartesian product of holding currencies × user preferences, minus identity' do
      eur = create(:stock, symbol: "IBE.MC", currency: "EUR")
      usd = create(:stock, symbol: "AAPL", currency: "USD")
      user_usd = create(:user, preferred_currency: "USD")
      user_eur = create(:user, preferred_currency: "EUR")
      create(:holding, user: user_usd, stock: eur)
      create(:holding, user: user_eur, stock: usd)

      expect(described_class.pairs_needed).to contain_exactly([ "EUR", "USD" ], [ "USD", "EUR" ])
    end
  end

  describe '.refresh_all' do
    it 'calls the provider for each pair and returns the result map' do
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).with("EUR", "USD").and_return(1.10)
      allow(YahooFinanceClient::Stock).to receive(:get_fx_rate).with("GBP", "USD").and_return(1.27)

      results = described_class.refresh_all([ [ "EUR", "USD" ], [ "GBP", "USD" ] ])

      expect(results).to eq("EURUSD" => 1.10, "GBPUSD" => 1.27)
    end
  end
end
