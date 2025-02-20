RSpec.describe FinancialDataProviders::AlphaVantageProvider, type: :model do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:raw_data) do
      double(
        symbol: 'AAPL',
        price: 150.00
      )
    end

    let(:expected_result) do
      {
        symbol: 'AAPL',
        price: 150.00
      }
    end

    before do
      allow(Alphavantage::TimeSeries).to receive(:new).with(symbol: symbol).and_return(
        double(quote: raw_data)
      )
    end

    it 'returns the normalized stock data' do
      result = described_class.get_stock(symbol)
      expect(result).to eq(expected_result)
    end

    it 'calls Alphavantage::TimeSeries with the correct symbol' do
      described_class.get_stock(symbol)
      expect(Alphavantage::TimeSeries).to have_received(:new).with(symbol: symbol)
    end
  end

  describe '.normalize_stock_data' do
    let(:data) do
      double(
        symbol: 'AAPL',
        price: 150.00
      )
    end

    let(:expected_result) do
      {
        symbol: 'AAPL',
        price: 150.00
      }
    end

    it 'normalizes the stock data correctly' do
      normalized_data = described_class.normalize_stock_data(data)
      expect(normalized_data).to eq(expected_result)
    end
  end
end
