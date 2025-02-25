RSpec.describe FinancialDataService, type: :service do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock) { build(:stock, symbol: 'AAPL', price: 150.00, name: 'Apple Inc.') }

    after do
      described_class.instance_variable_set(:@provider, nil)
    end

    context 'when using yahoo_finance provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:yahoo_finance)
        allow(FinancialDataProviders::YahooFinanceProvider).to receive(:new).
          and_return(double('YahooFinanceProvider', get_stock: stock))
      end

      it 'returns the stock data' do
        result = described_class.get_stock(symbol)
        expect(result.attributes.except('created_at', 'updated_at')).
          to eq(stock.attributes.except('created_at', 'updated_at'))
      end
    end

    context 'when using alpha_vantage provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:alpha_vantage)
        allow(FinancialDataProviders::AlphaVantageProvider).to receive(:new).
          and_return(double('AlphaVantageProvider', get_stock: stock))
      end

      it 'returns the stock data' do
        result = described_class.get_stock(symbol)
        expect(result.attributes.except('created_at', 'updated_at')).
          to eq(stock.attributes.except('created_at', 'updated_at'))
      end
    end

    context 'when using an unsupported provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:unsupported_provider)
      end

      it 'raises an error' do
        expect { described_class.get_stock(symbol) }.
          to raise_error(RuntimeError, /Provider not found: unsupported_provider/)
      end
    end
  end
end
