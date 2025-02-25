RSpec.describe FinancialDataService, type: :service do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock) { build(:stock, symbol: 'AAPL', price: 150.00, name: 'Apple Inc.') }
    let(:provider_instance) { instance_double('Provider') }

    context 'when using yahoo_finance provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:yahoo_finance)
        allow(FinancialDataProviders::YahooFinanceProvider).to receive(:new).and_return(provider_instance)
        allow(provider_instance).to receive(:get_stock).with(symbol).and_return(stock)
      end

      it 'returns the stock data' do
        result = FinancialDataService.get_stock(symbol)
        expect(result.attributes.except('created_at', 'updated_at')).
          to eq(stock.attributes.except('created_at', 'updated_at'))
      end
    end

    context 'when using alpha_vantage provider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:alpha_vantage)
        allow(FinancialDataProviders::AlphaVantageProvider).to receive(:new).and_return(provider_instance)
        allow(provider_instance).to receive(:get_stock).with(symbol).and_return(stock)
      end

      it 'returns the stock data' do
        result = FinancialDataService.get_stock(symbol)
        expect(result.attributes.except('created_at', 'updated_at')).
          to eq(stock.attributes.except('created_at', 'updated_at'))
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
