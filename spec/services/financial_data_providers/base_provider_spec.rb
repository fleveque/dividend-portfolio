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
