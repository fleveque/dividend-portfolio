RSpec.describe FinancialDataProviders::YahooFinanceProvider, type: :model do
  subject(:provider) { described_class.new }

  describe '#get_stock' do
    let(:symbol) { 'AAPL' }
    let(:raw_data) do
      {
        symbol: symbol,
        price: 150.00,
        dividend: 0.96
      }
    end
    let(:stock) { build(:stock, symbol: symbol, price: 150.00) }
    let(:dividend_history) do
      [
        { date: Date.new(2024, 2, 9), amount: 0.24 },
        { date: Date.new(2024, 5, 10), amount: 0.25 },
        { date: Date.new(2024, 8, 9), amount: 0.25 },
        { date: Date.new(2024, 11, 8), amount: 0.25 }
      ]
    end

    before do
      allow(YahooFinanceClient::Stock).to receive(:get_quote).with(symbol).and_return(raw_data)
      allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).with(symbol).and_return(dividend_history)
      allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
      allow(stock).to receive(:update!).and_return(true)

      Rails.cache.clear
    end

    it 'returns a Stock instance with data from Yahoo Finance' do
      result = provider.get_stock(symbol)
      expect(result).to eq(stock)
      expect(YahooFinanceClient::Stock).to have_received(:get_quote).with(symbol)
    end

    it 'fetches dividend history and stores inferred schedule' do
      provider.get_stock(symbol)
      expect(YahooFinanceClient::Stock).to have_received(:get_dividend_history).with(symbol)
      expect(stock).to have_received(:update!).with(
        hash_including(
          payment_frequency: "quarterly",
          payment_months: [ 2, 5, 8, 11 ],
          shifted_payment_months: []
        )
      )
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

    it 'does not set payment_frequency in normalize (handled by enrich)' do
      data = { symbol: 'AAPL', price: 150.00, dividend: 0.96 }
      result = provider.send(:normalize_yahoo_data, data)
      expect(result).not_to have_key(:payment_frequency)
    end
  end

  describe 'enrich_with_dividend_schedule' do
    context 'when dividend history is available' do
      let(:history) do
        (1..12).map { |i| { date: Date.new(2024, i, 15), amount: 0.25 } }
      end

      before do
        allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).and_return(history)
      end

      it 'infers monthly frequency from 12 dividends/year' do
        data = { symbol: 'O', price: 60.0, dividend: 3.0 }
        result = provider.send(:enrich_with_dividend_schedule, data, 'O')
        expect(result[:payment_frequency]).to eq("monthly")
        expect(result[:payment_months]).to eq((1..12).to_a)
      end
    end

    context 'when dividend history is empty but stock pays dividends' do
      before do
        allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).and_return([])
      end

      it 'falls back to quarterly with empty months' do
        data = { symbol: 'AAPL', price: 150.0, dividend: 0.96 }
        result = provider.send(:enrich_with_dividend_schedule, data, 'AAPL')
        expect(result[:payment_frequency]).to eq("quarterly")
        expect(result[:payment_months]).to eq([])
      end
    end

    context 'when stock does not pay dividends' do
      before do
        allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).and_return([])
      end

      it 'does not set dividend schedule fields' do
        data = { symbol: 'GOOG', price: 140.0, dividend: nil }
        result = provider.send(:enrich_with_dividend_schedule, data, 'GOOG')
        expect(result).not_to have_key(:payment_frequency)
        expect(result).not_to have_key(:payment_months)
      end
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
        allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).and_return([])
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
        allow(YahooFinanceClient::Stock).to receive(:get_dividend_history).and_return([])
      end

      it 'falls back to sequential fetching' do
        result = provider.refresh_stocks
        expect(result[:updated]).to eq(1)
        expect(YahooFinanceClient::Stock).to have_received(:get_quote).with('AAPL')
      end
    end
  end
end
