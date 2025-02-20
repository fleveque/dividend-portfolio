RSpec.describe FinancialDataProviders::YahooFinanceProvider, type: :model do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock_data) { { symbol: 'AAPL', price: 150.00 } }

    before do
      allow(YahooFinanceClient::Stock).to receive(:get_quote).with(symbol).and_return(stock_data)
    end

    it 'returns the normalized stock data' do
      result = described_class.get_stock(symbol)
      expect(result).to eq({ symbol: 'EXAMPLE', price: '123.45' })
    end

    it 'calls YahooFinanceClient::Stock.get_quote with the correct symbol' do
      described_class.get_stock(symbol)
      expect(YahooFinanceClient::Stock).to have_received(:get_quote).with(symbol)
    end
  end

  describe '.normalize_stock_data' do
    let(:data) { { symbol: 'AAPL', price: 150.00 } }

    it 'normalizes the stock data correctly' do
      normalized_data = described_class.normalize_stock_data(data)
      expect(normalized_data).to eq({ symbol: 'EXAMPLE', price: '123.45' })
    end
  end
end
