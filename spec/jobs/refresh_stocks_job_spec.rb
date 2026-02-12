RSpec.describe RefreshStocksJob, type: :job do
  describe '#perform' do
    context 'when the market is open' do
      before do
        allow(MarketHoursService).to receive(:market_open?).and_return(true)
      end

      it 'calls FinancialDataService.refresh_stocks' do
        allow(FinancialDataService).to receive(:refresh_stocks).and_return({ updated: 5, errors: [] })

        described_class.perform_now

        expect(FinancialDataService).to have_received(:refresh_stocks)
      end

      it 'logs the result' do
        allow(FinancialDataService).to receive(:refresh_stocks).and_return({ updated: 3, errors: [ 'FAIL' ] })
        logger = ActiveSupport::Logger.new(nil)
        allow(Rails).to receive(:logger).and_return(logger)
        allow(logger).to receive(:info)
        allow(logger).to receive(:warn)

        described_class.perform_now

        expect(logger).to have_received(:info).with(/Updated 3 stocks, 1 errors/)
        expect(logger).to have_received(:warn).with(/Failed symbols: FAIL/)
      end
    end

    context 'when the market is closed' do
      before do
        allow(MarketHoursService).to receive(:market_open?).and_return(false)
      end

      it 'skips the refresh' do
        expect(FinancialDataService).not_to receive(:refresh_stocks)

        described_class.perform_now
      end

      it 'logs that the market is closed' do
        logger = ActiveSupport::Logger.new(nil)
        allow(Rails).to receive(:logger).and_return(logger)
        allow(logger).to receive(:info)

        described_class.perform_now

        expect(logger).to have_received(:info).with(/Market is closed, skipping refresh/)
      end
    end

    context 'when force is true and market is closed' do
      before do
        allow(MarketHoursService).to receive(:market_open?).and_return(false)
      end

      it 'refreshes stocks regardless of market hours' do
        allow(FinancialDataService).to receive(:refresh_stocks).and_return({ updated: 5, errors: [] })

        described_class.perform_now(force: true)

        expect(FinancialDataService).to have_received(:refresh_stocks)
      end
    end
  end
end
