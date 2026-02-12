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

  describe 'normalize_yahoo_data' do
    it 'passes through ex_dividend_date from the gem' do
      data = {
        symbol: 'AAPL', price: 150.00, dividend: 0.96,
        ex_dividend_date: Date.new(2024, 3, 14)
      }
      result = provider.send(:normalize_yahoo_data, data)
      expect(result[:ex_dividend_date]).to eq(Date.new(2024, 3, 14))
    end

    it 'infers quarterly frequency for dividend-paying stocks' do
      data = { symbol: 'AAPL', price: 150.00, dividend: 0.96 }
      result = provider.send(:normalize_yahoo_data, data)
      expect(result[:payment_frequency]).to eq("quarterly")
    end

    it 'returns nil frequency for non-dividend stocks' do
      data = { symbol: 'GOOG', price: 140.00, dividend: nil }
      result = provider.send(:normalize_yahoo_data, data)
      expect(result[:payment_frequency]).to be_nil
    end
  end

  describe '#refresh_stocks' do
    before { Rails.cache.clear }

    context 'when bulk fetch succeeds' do
      let!(:stock_aapl) { create(:stock, symbol: 'AAPL', price: 100.00) }
      let!(:stock_msft) { create(:stock, symbol: 'MSFT', price: 200.00) }

      let(:bulk_quotes) do
        {
          'AAPL' => { symbol: 'AAPL', price: 155.00, name: 'Apple Inc.', ma50: 148.5, ma200: 145.0,
                       eps: nil, pe_ratio: nil, dividend: nil, dividend_yield: nil, payout_ratio: nil },
          'MSFT' => { symbol: 'MSFT', price: 385.00, name: 'Microsoft Corp.', ma50: 375.0, ma200: 360.0,
                       eps: nil, pe_ratio: nil, dividend: nil, dividend_yield: nil, payout_ratio: nil }
        }
      end

      before do
        allow(YahooFinanceClient::Stock).to receive(:get_quotes).and_return(bulk_quotes)
      end

      it 'uses bulk API and updates all stocks' do
        result = provider.refresh_stocks
        expect(result[:updated]).to eq(2)
        expect(result[:errors]).to be_empty
        expect(YahooFinanceClient::Stock).to have_received(:get_quotes).with(%w[AAPL MSFT])
      end
    end

    context 'when bulk fetch raises an error' do
      let!(:stock) { create(:stock, symbol: 'AAPL', price: 100.00) }

      before do
        allow(YahooFinanceClient::Stock).to receive(:get_quotes).and_raise(StandardError.new('API down'))
        allow(YahooFinanceClient::Stock).to receive(:get_quote).with('AAPL').and_return(
          { symbol: 'AAPL', price: 155.00 }
        )
      end

      it 'falls back to sequential fetching' do
        result = provider.refresh_stocks
        expect(result[:updated]).to eq(1)
        expect(YahooFinanceClient::Stock).to have_received(:get_quote).with('AAPL')
      end
    end
  end
end
