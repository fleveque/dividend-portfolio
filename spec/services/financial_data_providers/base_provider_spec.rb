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
end
