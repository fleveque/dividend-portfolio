require 'rails_helper'

RSpec.describe FinancialDataProviders::AlphaVantageFxProvider do
  before { allow(ENV).to receive(:[]).and_call_original }

  describe '.get_fx_rate' do
    context 'identity pair' do
      it 'returns 1.0 without an API call' do
        expect(HTTParty).not_to receive(:get)
        expect(described_class.get_fx_rate("USD", "USD")).to eq(1.0)
      end
    end

    context 'missing API key' do
      before { allow(ENV).to receive(:[]).with("ALPHAVANTAGE_API_KEY").and_return(nil) }

      it 'returns nil without calling out' do
        expect(HTTParty).not_to receive(:get)
        expect(described_class.get_fx_rate("EUR", "USD")).to be_nil
      end
    end

    context 'valid response' do
      let(:response) do
        instance_double(
          HTTParty::Response,
          parsed_response: {
            "Realtime Currency Exchange Rate" => {
              "1. From_Currency Code" => "EUR",
              "3. To_Currency Code" => "USD",
              "5. Exchange Rate" => "1.0823"
            }
          }
        )
      end

      before do
        allow(ENV).to receive(:[]).with("ALPHAVANTAGE_API_KEY").and_return("test_key")
        allow(HTTParty).to receive(:get).and_return(response)
      end

      it 'returns the parsed rate as a Float' do
        expect(described_class.get_fx_rate("EUR", "USD")).to eq(1.0823)
      end

      it 'sends from/to currency codes + api key in the query' do
        described_class.get_fx_rate("EUR", "USD")
        expect(HTTParty).to have_received(:get).with(
          described_class::BASE_URL,
          hash_including(query: hash_including(
            function: "CURRENCY_EXCHANGE_RATE",
            from_currency: "EUR",
            to_currency: "USD",
            apikey: "test_key"
          ))
        )
      end
    end

    context 'response missing the rate field (rate-limited / bad symbol)' do
      let(:response) do
        instance_double(HTTParty::Response, parsed_response: { "Note" => "API call frequency..." })
      end

      before do
        allow(ENV).to receive(:[]).with("ALPHAVANTAGE_API_KEY").and_return("test_key")
        allow(HTTParty).to receive(:get).and_return(response)
      end

      it 'returns nil' do
        expect(described_class.get_fx_rate("EUR", "USD")).to be_nil
      end
    end

    context 'HTTP error' do
      before do
        allow(ENV).to receive(:[]).with("ALPHAVANTAGE_API_KEY").and_return("test_key")
        allow(HTTParty).to receive(:get).and_raise(StandardError, "boom")
      end

      it 'returns nil and logs' do
        expect(Rails.logger).to receive(:warn).with(/AlphaVantage FX error EUR->USD/)
        expect(described_class.get_fx_rate("EUR", "USD")).to be_nil
      end
    end
  end
end
