RSpec.describe FinancialDataProviders::AlphaVantageProvider, type: :model do
  subject(:provider) { described_class.new }

  describe '#get_stock' do
    let(:symbol) { 'AAPL' }
    let(:raw_data) do
      double(
        symbol: symbol,
        price: 150.00
      )
    end
    let(:stock) { build(:stock, symbol: symbol, price: 150.00) }

    before do
      allow(Alphavantage::TimeSeries).to receive(:new).with(symbol: symbol).and_return(
        double(quote: raw_data)
      )
      allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
      allow(stock).to receive(:update!).and_return(true)
      allow(stock).to receive(:to_json).and_return(stock.attributes.to_json)
      allow(stock).to receive(:assign_attributes).and_return(true)

      Rails.cache.clear
    end

    it 'returns a Stock instance with data from Alpha Vantage' do
      result = provider.get_stock(symbol)
      expect(result).to eq(stock)
      expect(Alphavantage::TimeSeries).to have_received(:new).with(symbol: symbol)
    end

    context 'when API returns nil' do
      before do
        allow(Alphavantage::TimeSeries).to receive(:new).with(symbol: 'INVALID')
          .and_return(double(quote: nil))
      end

      it 'returns nil' do
        result = provider.get_stock('INVALID')
        expect(result).to be_nil
      end
    end

    context 'when API raises an error' do
      before do
        allow(Alphavantage::TimeSeries).to receive(:new)
          .and_raise(StandardError.new('API Error'))
      end

      it 'returns nil and logs error' do
        expect(Rails.logger).to receive(:error).with(/AlphaVantage API error: API Error/)
        result = provider.get_stock('AAPL')
        expect(result).to be_nil
      end
    end
  end
end
