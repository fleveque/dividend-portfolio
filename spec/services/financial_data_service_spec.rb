RSpec.describe FinancialDataService, type: :service do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock_data) { { symbol: 'AAPL', price: 150.00, name: 'Apple Inc.' } }

    context 'when using yahoo_finance provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:yahoo_finance)
        allow(FinancialDataProviders::YahooFinanceProvider).to receive(:get_stock).with(symbol).and_return(stock_data)
      end

      it 'returns the stock data' do
        result = FinancialDataService.get_stock(symbol)
        expect(result).to eq(stock_data)
      end
    end

    context 'when using alpha_vantage provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:alpha_vantage)
        allow(FinancialDataProviders::AlphaVantageProvider).to receive(:get_stock).with(symbol).and_return(stock_data)
      end

      it 'returns the stock data' do
        result = FinancialDataService.get_stock(symbol)
        expect(result).to eq(stock_data)
      end
    end

    context 'when using an unsupported provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:unsupported_provider)
      end

      it 'raises an error' do
        expect { FinancialDataService.get_stock(symbol) }.
          to raise_error(RuntimeError, /Provider not found: unsupported_provider/)
      end
    end
  end
end
