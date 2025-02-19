RSpec.describe FinancialDataService, type: :service do
  describe '.get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock_data) { { symbol: 'AAPL', price: 150.00, name: 'Apple Inc.' } }

    context 'when the financial data provider is YahooFinanceProvider' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:yahoo_finance_client)
        allow(FinancialDataProviders::YahooFinanceProvider).to receive(:get_stock).with(symbol).and_return(stock_data)
      end

      it 'returns the stock data from YahooFinanceProvider' do
        result = FinancialDataService.get_stock(symbol)
        expect(result).to eq(stock_data)
      end

      it 'calls the YahooFinanceProvider with the correct symbol' do
        FinancialDataService.get_stock(symbol)
        expect(FinancialDataProviders::YahooFinanceProvider).to have_received(:get_stock).with(symbol)
      end
    end

    context 'when the financial data provider is unknown' do
      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(:unknown_provider)
      end

      it 'raises an error' do
        expect { FinancialDataService.get_stock(symbol) }.
          to raise_error('Unknown financial data provider: unknown_provider')
      end
    end
  end
end
