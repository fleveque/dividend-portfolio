require 'rails_helper'

RSpec.describe PortfolioStatsService do
  describe '.call' do
    let(:user) { create(:user, preferred_currency: "USD") }

    it 'returns nil for an empty portfolio' do
      expect(described_class.call(user)).to be_nil
    end

    context 'with a single-currency (USD) portfolio' do
      before do
        aapl = create(:stock, symbol: "AAPL", currency: "USD", price: 200.0, dividend: 4.0, sector: "Technology")
        ko   = create(:stock, symbol: "KO",   currency: "USD", price: 60.0,  dividend: 1.80, sector: "Consumer Staples")
        create(:holding, user: user, stock: aapl, quantity: 10, average_price: 150.0) # cost 1500, value 2000, inc 40
        create(:holding, user: user, stock: ko,   quantity: 50, average_price: 50.0)  # cost 2500, value 3000, inc 90
      end

      it 'computes YoC and current yield per currency' do
        result = described_class.call(user)
        # income 130 / cost 4000 = 3.25%; income 130 / value 5000 = 2.6%
        expect(result[:byCurrency]["USD"][:yoc]).to be_within(0.01).of(3.25)
        expect(result[:byCurrency]["USD"][:currentYield]).to be_within(0.01).of(2.6)
      end

      it 'fills displayYoc and displayCurrentYield with the same numbers (identity FX)' do
        result = described_class.call(user)
        expect(result[:displayCurrency]).to eq("USD")
        expect(result[:displayYoc]).to be_within(0.01).of(3.25)
        expect(result[:displayCurrentYield]).to be_within(0.01).of(2.6)
      end

      it 'groups sectors by market value (in display currency)' do
        result = described_class.call(user)
        sectors = result[:sectors]
        expect(sectors.size).to eq(2)
        # Consumer Staples (3000) > Technology (2000)
        expect(sectors.first[:sector]).to eq("Consumer Staples")
        expect(sectors.first[:percent]).to eq(60.0)
        expect(sectors.last[:percent]).to eq(40.0)
      end
    end

    context 'with a mixed-currency portfolio and FX' do
      before do
        aapl    = create(:stock, symbol: "AAPL",   currency: "USD", price: 200.0, dividend: 4.0)
        iberdrola = create(:stock, symbol: "IBE.MC", currency: "EUR", price: 14.0,  dividend: 0.5)
        create(:holding, user: user, stock: aapl,      quantity: 10, average_price: 150.0)
        create(:holding, user: user, stock: iberdrola, quantity: 100, average_price: 12.0)
        allow(FxRateService).to receive(:convert) do |amount, from:, to:|
          if from == to
            amount
          elsif from == "EUR" && to == "USD"
            amount * 1.1
          end
        end
      end

      it 'populates byCurrency with per-currency yields' do
        result = described_class.call(user)
        expect(result[:byCurrency].keys).to contain_exactly("USD", "EUR")
      end

      it 'produces a display-currency aggregate using the FX rate' do
        result = described_class.call(user)
        # USD: inc=40, cost=1500, value=2000
        # EUR converted to USD: inc=50*1.1=55, cost=1200*1.1=1320, value=1400*1.1=1540
        # display_yoc = (40 + 55) / (1500 + 1320) ≈ 3.37
        expect(result[:displayYoc]).to be_within(0.05).of(3.37)
      end
    end

    context 'when FX conversion fails' do
      before do
        aapl    = create(:stock, symbol: "AAPL",   currency: "USD", price: 200.0, dividend: 4.0)
        iberdrola = create(:stock, symbol: "IBE.MC", currency: "EUR", price: 14.0,  dividend: 0.5)
        create(:holding, user: user, stock: aapl,      quantity: 10, average_price: 150.0)
        create(:holding, user: user, stock: iberdrola, quantity: 100, average_price: 12.0)
        allow(FxRateService).to receive(:convert) do |amount, from:, to:|
          from == to ? amount : nil
        end
      end

      it 'returns nil for displayYoc and displayCurrentYield' do
        result = described_class.call(user)
        expect(result[:displayYoc]).to be_nil
        expect(result[:displayCurrentYield]).to be_nil
      end

      it 'still populates byCurrency' do
        result = described_class.call(user)
        expect(result[:byCurrency].keys).to contain_exactly("USD", "EUR")
      end

      it 'returns an empty sectors array (no partial render)' do
        result = described_class.call(user)
        expect(result[:sectors]).to eq([])
      end
    end

    context 'sectors with nil values' do
      before do
        with_sector = create(:stock, symbol: "AAPL", currency: "USD", price: 200.0, dividend: 4.0, sector: "Technology")
        no_sector   = create(:stock, symbol: "XYZ",  currency: "USD", price: 50.0,  dividend: 1.0, sector: nil)
        create(:holding, user: user, stock: with_sector, quantity: 10, average_price: 150.0) # 2000
        create(:holding, user: user, stock: no_sector,   quantity: 20, average_price: 40.0)  # 1000
      end

      it 'buckets nil-sector holdings as Unknown' do
        result = described_class.call(user)
        sectors = result[:sectors].map { |s| s[:sector] }
        expect(sectors).to contain_exactly("Technology", "Unknown")
      end
    end

    context 'when no holding has a sector at all' do
      before do
        s = create(:stock, symbol: "AAPL", currency: "USD", price: 200.0, dividend: 4.0, sector: nil)
        create(:holding, user: user, stock: s, quantity: 10, average_price: 150.0)
      end

      it 'returns an empty sectors array' do
        result = described_class.call(user)
        expect(result[:sectors]).to eq([])
      end
    end
  end
end
