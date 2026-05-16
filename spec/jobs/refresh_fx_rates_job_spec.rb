require 'rails_helper'

RSpec.describe RefreshFxRatesJob, type: :job do
  describe '#perform' do
    it 'calls FxRateService.refresh_all with the pairs it needs' do
      pairs = [ [ "EUR", "USD" ], [ "USD", "EUR" ] ]
      expect(FxRateService).to receive(:pairs_needed).and_return(pairs)
      expect(FxRateService).to receive(:refresh_all).with(pairs).and_return("EURUSD" => 1.10, "USDEUR" => 0.91)

      described_class.new.perform
    end

    it 'logs the refresh result' do
      allow(FxRateService).to receive_messages(pairs_needed: [], refresh_all: {})
      expect(Rails.logger).to receive(:info).with(/RefreshFxRatesJob: Refreshed/)

      described_class.new.perform
    end
  end
end
