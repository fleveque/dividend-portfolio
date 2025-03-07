RSpec.describe FinancialDataProviders::YahooFinanceProvider, type: :model do
  subject(:provider) { described_class.new }

  describe '#get_stock' do
    let(:symbol) { 'AAPL' }
    let(:raw_data) do
      {
        symbol: symbol,
        price: 150.00
      }
    end
    let(:stock) { build(:stock, symbol: symbol, price: 150.00) }

    before do
      allow(YahooFinanceClient::Stock).to receive(:get_quote).with(symbol).and_return(raw_data)
      allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
      allow(stock).to receive(:update!).and_return(true)
      allow(stock).to receive(:to_json).and_return(stock.attributes.to_json)
      allow(stock).to receive(:assign_attributes).and_return(true)

      Rails.cache.clear
    end

    it 'returns a Stock instance with data from Yahoo Finance' do
      result = provider.get_stock(symbol)
      expect(result).to eq(stock)
      expect(YahooFinanceClient::Stock).to have_received(:get_quote).with(symbol)
    end
  end
end
