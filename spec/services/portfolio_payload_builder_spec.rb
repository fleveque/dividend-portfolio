require 'rails_helper'

RSpec.describe PortfolioPayloadBuilder do
  describe '.call' do
    let(:user) { create(:user, portfolio_slug: "alice") }
    let(:stock) { create(:stock, symbol: "AAPL", currency: "USD", price: 175.50) }

    before do
      create(:holding, user: user, stock: stock, quantity: 10, average_price: 150.0)
      allow(FxRateService).to receive(:convert) do |amount, **_opts|
        amount
      end
    end

    it 'emits the v2 envelope (version + base_currency)' do
      payload = described_class.call(user)
      expect(payload[:version]).to eq(2)
      expect(payload[:slug]).to eq("alice")
      expect(payload[:base_currency]).to eq("USD")
    end

    it 'keeps the legacy per-holding fields for the pulse v1 fallback' do
      holding = described_class.call(user)[:holdings].first
      expect(holding[:symbol]).to eq("AAPL")
      expect(holding[:quantity]).to eq(10.0)
      expect(holding[:avg_price]).to eq(150.0)
      expect(holding[:price]).to eq(175.50)
    end

    it 'adds the v2 fields: currency, value_in_base, value_in_usd' do
      holding = described_class.call(user)[:holdings].first
      expect(holding[:currency]).to eq("USD")
      expect(holding[:value_in_base]).to eq(1755.0)
      expect(holding[:value_in_usd]).to eq(1755.0)
    end

    it 'coerces missing stock price to 0.0' do
      stock.update_column(:price, nil)
      payload = described_class.call(user)
      expect(payload[:holdings].first[:price]).to eq(0.0)
      expect(payload[:holdings].first[:value_in_base]).to eq(0.0)
    end

    it 'serializes every holding for the user' do
      goog = create(:stock, symbol: "GOOG", price: 200.0)
      create(:holding, user: user, stock: goog, quantity: 5, average_price: 180.0)

      symbols = described_class.call(user)[:holdings].map { |h| h[:symbol] }
      expect(symbols).to contain_exactly("AAPL", "GOOG")
    end

    context 'with a non-USD base currency' do
      let(:eur_stock) { create(:stock, symbol: "IBE.MC", currency: "EUR", price: 14.50) }

      before do
        user.update!(preferred_currency: "EUR")
        create(:holding, user: user, stock: eur_stock, quantity: 20, average_price: 12.0)
        allow(FxRateService).to receive(:convert).with(1755.0, from: "USD", to: "EUR").and_return(1580.0)
        allow(FxRateService).to receive(:convert).with(290.0, from: "EUR", to: "EUR").and_return(290.0)
        allow(FxRateService).to receive(:convert).with(1755.0, from: "USD", to: "USD").and_return(1755.0)
        allow(FxRateService).to receive(:convert).with(290.0, from: "EUR", to: "USD").and_return(319.0)
      end

      it 'sets base_currency to the user preference' do
        expect(described_class.call(user)[:base_currency]).to eq("EUR")
      end

      it 'converts the USD holding into the EUR base' do
        aapl = described_class.call(user)[:holdings].find { |h| h[:symbol] == "AAPL" }
        expect(aapl[:value_in_base]).to eq(1580.0)
        expect(aapl[:value_in_usd]).to eq(1755.0)
      end

      it 'leaves the EUR holding untouched in base and converts to USD separately' do
        ibe = described_class.call(user)[:holdings].find { |h| h[:symbol] == "IBE.MC" }
        expect(ibe[:value_in_base]).to eq(290.0)
        expect(ibe[:value_in_usd]).to eq(319.0)
      end
    end

    context 'when an FX rate is unavailable' do
      it 'emits nil for value_in_base so pulse falls back to its v1 math' do
        allow(FxRateService).to receive(:convert).and_return(nil)
        holding = described_class.call(user)[:holdings].first
        expect(holding[:value_in_base]).to be_nil
        expect(holding[:value_in_usd]).to be_nil
      end
    end

    describe 'stats block' do
      it 'includes pre-aggregated yields + sectors so pulse renders directly' do
        bob = create(:user, portfolio_slug: "bob")
        div_stock = create(:stock, symbol: "DIV", currency: "USD", price: 100.0, dividend: 5.0, sector: "Energy")
        create(:holding, user: bob, stock: div_stock, quantity: 10, average_price: 80.0)

        stats = described_class.call(bob)[:stats]
        expect(stats[:yoc]).to be_within(0.01).of(6.25)            # 50 / 800
        expect(stats[:currentYield]).to be_within(0.01).of(5.0)    # 50 / 1000
        expect(stats[:sectors].first[:sector]).to eq("Energy")
        expect(stats[:sectors].first[:percent]).to eq(100.0)
      end

      it 'is nil when the user has no holdings' do
        no_holdings_user = create(:user, portfolio_slug: "empty-#{SecureRandom.hex(4)}")
        expect(described_class.call(no_holdings_user)[:stats]).to be_nil
      end
    end
  end
end
