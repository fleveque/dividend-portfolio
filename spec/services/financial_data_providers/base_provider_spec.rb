RSpec.describe FinancialDataProviders::BaseProvider, type: :model do
  describe '.get_stock' do
    it 'raises NotImplementedError' do
      expect { described_class.get_stock('AAPL') }.
        to raise_error(NotImplementedError, "Subclasses must implement the get_stock method")
    end
  end

  describe '.normalize_stock_data' do
    it 'normalizes the data correctly' do
      normalized_data = described_class.normalize_stock_data(symbol: 'AAPL', price: 150.00, name: 'Apple Inc.')
      expect(normalized_data).to eq({ symbol: 'AAPL', price: 150.00, name: 'Apple Inc.' })
    end
  end
end
