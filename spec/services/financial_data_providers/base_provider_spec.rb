RSpec.describe FinancialDataProviders::BaseProvider, type: :model do
  describe '#get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock_data) { { symbol: symbol, price: 150.00 } }
    let(:stock) { build(:stock, symbol: symbol, price: 150.00) }

    context 'with caching' do
      let(:test_provider) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            { symbol: symbol, price: 150.00 }
          end
        end.new
      end

      before do
        allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
        allow(stock).to receive(:update!).and_return(true)

        Rails.cache.clear
      end

      it 'caches the stock object and returns it directly' do
        result = test_provider.get_stock(symbol)
        expect(result.symbol).to eq(stock.symbol)
        expect(result.price).to eq(stock.price)

        # Second call should return cached stock without calling update! again
        cached_result = test_provider.get_stock(symbol)
        expect(cached_result.symbol).to eq(stock.symbol)
        expect(stock).to have_received(:update!).once
      end

      it 'normalizes symbol to uppercase' do
        test_provider.get_stock('aapl')
        expect(Stock).to have_received(:find_or_initialize_by).with(symbol: 'AAPL')
      end

      it 'stores the stock data in the database' do
        test_provider.get_stock(symbol)
        expect(stock).to have_received(:update!).with(
          hash_including(
            symbol: stock_data[:symbol],
            price: stock_data[:price],
            updated_at: be_within(1.second).of(Time.current)
          )
        )
      end
    end

    context 'with dividend schedule fields' do
      let(:provider_with_schedule) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            {
              symbol: symbol, price: 150.00,
              ex_dividend_date: Date.new(2024, 3, 14),
              payment_frequency: "quarterly",
              payment_months: [ 3, 6, 9, 12 ],
              shifted_payment_months: []
            }
          end
        end.new
      end

      before do
        allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
        allow(stock).to receive(:update!).and_return(true)
        Rails.cache.clear
      end

      it 'includes dividend schedule fields in normalized data' do
        provider_with_schedule.get_stock(symbol)
        expect(stock).to have_received(:update!).with(
          hash_including(
            ex_dividend_date: Date.new(2024, 3, 14),
            payment_frequency: "quarterly",
            payment_months: [ 3, 6, 9, 12 ],
            shifted_payment_months: []
          )
        )
      end
    end
  end

  describe '#infer_dividend_schedule' do
    let(:provider) { described_class.new }

    context 'with quarterly history (4 dividends/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 2, 9), amount: 0.24 },
          { date: Date.new(2024, 5, 10), amount: 0.25 },
          { date: Date.new(2024, 8, 9), amount: 0.25 },
          { date: Date.new(2024, 11, 8), amount: 0.25 },
          { date: Date.new(2025, 2, 7), amount: 0.25 },
          { date: Date.new(2025, 5, 9), amount: 0.25 },
          { date: Date.new(2025, 8, 8), amount: 0.25 },
          { date: Date.new(2025, 11, 7), amount: 0.25 }
        ]
      end

      it 'infers quarterly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("quarterly")
      end

      it 'extracts actual payment months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 2, 5, 8, 11 ])
      end

      it 'has no shifted months for consistent history' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:shifted_payment_months]).to eq([])
      end
    end

    context 'with monthly history (12 dividends/year)' do
      let(:history) do
        (1..24).map do |i|
          { date: Date.new(2024, 1, 15) + (i - 1).months, amount: 0.25 }
        end
      end

      it 'infers monthly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("monthly")
      end

      it 'returns all 12 months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq((1..12).to_a)
      end
    end

    context 'with semi-annual history (2 dividends/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 6, 1), amount: 1.0 },
          { date: Date.new(2024, 12, 1), amount: 1.0 },
          { date: Date.new(2025, 6, 1), amount: 1.0 },
          { date: Date.new(2025, 12, 1), amount: 1.0 }
        ]
      end

      it 'infers semi_annual frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("semi_annual")
      end

      it 'extracts payment months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 6, 12 ])
      end
    end

    context 'with annual history (1 dividend/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 9, 1), amount: 5.0 },
          { date: Date.new(2025, 9, 1), amount: 5.0 }
        ]
      end

      it 'infers annual frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("annual")
      end
    end

    context 'with empty history' do
      it 'returns empty hash' do
        result = provider.send(:infer_dividend_schedule, [])
        expect(result).to eq({})
      end
    end

    context 'with nil history' do
      it 'returns empty hash' do
        result = provider.send(:infer_dividend_schedule, nil)
        expect(result).to eq({})
      end
    end

    context 'with month-shifting dividends (e.g. KO)' do
      let(:history) do
        [
          { date: Date.new(2024, 3, 14), amount: 0.485 },
          { date: Date.new(2024, 6, 13), amount: 0.485 },
          { date: Date.new(2024, 9, 12), amount: 0.485 },
          { date: Date.new(2024, 11, 29), amount: 0.485 },
          { date: Date.new(2025, 3, 13), amount: 0.51 },
          { date: Date.new(2025, 6, 12), amount: 0.51 },
          { date: Date.new(2025, 9, 11), amount: 0.51 },
          { date: Date.new(2025, 12, 12), amount: 0.51 }
        ]
      end

      it 'infers quarterly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("quarterly")
      end

      it 'includes all historical months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 3, 6, 9, 11, 12 ])
      end

      it 'marks months appearing only once as shifted' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:shifted_payment_months]).to eq([ 11, 12 ])
      end
    end
  end

  describe '#refresh_stocks' do
    let(:test_provider) do
      Class.new(described_class) do
        def fetch_and_normalize_stock(symbol)
          { symbol: symbol, price: 150.00 }
        end
      end.new
    end

    before do
      Rails.cache.clear
    end

    context 'when there are stocks to refresh' do
      let!(:stock_aapl) { create(:stock, symbol: 'AAPL', price: 100.00) }
      let!(:stock_msft) { create(:stock, symbol: 'MSFT', price: 200.00) }

      it 'updates all stocks and returns the count' do
        result = test_provider.refresh_stocks
        expect(result[:updated]).to eq(2)
        expect(result[:errors]).to be_empty
        expect(stock_aapl.reload.price).to eq(150.00)
        expect(stock_msft.reload.price).to eq(150.00)
      end

      it 'warms the Rails cache for each stock' do
        test_provider.refresh_stocks
        expect(Rails.cache.read("stock/AAPL")).to be_present
        expect(Rails.cache.read("stock/MSFT")).to be_present
      end
    end

    context 'when there are no stocks' do
      it 'returns zero updated and no errors' do
        result = test_provider.refresh_stocks
        expect(result).to eq({ updated: 0, errors: [] })
      end
    end

    context 'when a stock fails to refresh' do
      let!(:stock) { create(:stock, symbol: 'FAIL', price: 100.00) }

      let(:failing_provider) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            nil
          end
        end.new
      end

      it 'adds the symbol to errors' do
        result = failing_provider.refresh_stocks
        expect(result[:updated]).to eq(0)
        expect(result[:errors]).to eq([ 'FAIL' ])
      end
    end
  end
end
