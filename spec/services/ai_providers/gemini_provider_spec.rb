RSpec.describe AiProviders::GeminiProvider, type: :service do
  subject(:provider) { described_class.new }

  let(:stocks_data) do
    [
      { symbol: "AAPL", price: 150.0, dividendYield: 0.6, payoutRatio: 15.0 },
      { symbol: "KO", price: 55.0, dividendYield: 3.2, payoutRatio: 70.0 }
    ]
  end

  let(:stock_data) do
    { id: 1, symbol: "AAPL", price: 150.0, dividendYield: 0.6, updated_at: 1234567890 }
  end

  let(:gemini_radar_response) do
    {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => {
                  summary: "A balanced portfolio",
                  buyingOpportunities: [ { symbol: "KO", reason: "Below target" } ],
                  coverageGaps: "No coverage in Jan-Feb",
                  riskFlags: [],
                  strengths: [ "Good diversification" ]
                }.to_json
              }
            ]
          }
        }
      ]
    }
  end

  let(:gemini_stock_response) do
    {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => {
                  summary: "AAPL is a tech leader",
                  verdict: "hold",
                  keyPoints: [ "Low yield", "Strong growth" ]
                }.to_json
              }
            ]
          }
        }
      ]
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("GEMINI_API_KEY").and_return("test_api_key")
  end

  describe "#radar_insights" do
    context "with empty stocks data" do
      it "returns empty insights without making an API call" do
        result = provider.radar_insights([])

        expect(result[:summary]).to include("Add stocks")
        expect(result[:buyingOpportunities]).to eq([])
      end
    end

    context "with stocks data" do
      it "returns parsed JSON from Gemini response" do
        stub_gemini_request(gemini_radar_response)

        result = provider.radar_insights(stocks_data)

        expect(result[:summary]).to eq("A balanced portfolio")
        expect(result[:buyingOpportunities].length).to eq(1)
        expect(result[:buyingOpportunities].first[:symbol]).to eq("KO")
        expect(result[:strengths]).to include("Good diversification")
      end

      it "caches responses" do
        faraday_response = stub_gemini_request(gemini_radar_response)

        provider.radar_insights(stocks_data)
        provider.radar_insights(stocks_data)

        expect(faraday_response).to have_received(:post).once
      end
    end

    context "when API returns an error" do
      it "raises AiError" do
        stub_gemini_error(500, "Internal Server Error")

        expect { provider.radar_insights(stocks_data) }.to raise_error(
          AiProviders::BaseProvider::AiError, /Gemini API error/
        )
      end
    end

    context "when GEMINI_API_KEY is missing" do
      before do
        allow(ENV).to receive(:[]).with("GEMINI_API_KEY").and_return(nil)
      end

      it "raises AiError" do
        expect { provider.radar_insights(stocks_data) }.to raise_error(
          AiProviders::BaseProvider::AiError, /GEMINI_API_KEY is not configured/
        )
      end
    end
  end

  describe "#stock_summary" do
    context "with empty stock data" do
      it "returns empty summary without making an API call" do
        result = provider.stock_summary({})

        expect(result[:summary]).to include("No data")
        expect(result[:verdict]).to eq("hold")
      end
    end

    context "with stock data" do
      it "returns parsed JSON from Gemini response" do
        stub_gemini_request(gemini_stock_response)

        result = provider.stock_summary(stock_data)

        expect(result[:summary]).to eq("AAPL is a tech leader")
        expect(result[:verdict]).to eq("hold")
        expect(result[:keyPoints]).to include("Low yield")
      end
    end
  end

  private

  def stub_gemini_request(response_body)
    faraday_response = instance_double(Faraday::Response, success?: true, body: response_body)
    faraday_connection = instance_double(Faraday::Connection)
    allow(faraday_connection).to receive(:post).and_yield(
      Faraday::Request.new
    ).and_return(faraday_response)
    allow(Faraday).to receive(:new).and_return(faraday_connection)
    faraday_connection
  end

  def stub_gemini_error(status, message)
    faraday_response = instance_double(
      Faraday::Response,
      success?: false,
      status: status,
      body: { "error" => { "message" => message } }
    )
    faraday_connection = instance_double(Faraday::Connection)
    allow(faraday_connection).to receive(:post).and_yield(
      Faraday::Request.new
    ).and_return(faraday_response)
    allow(Faraday).to receive(:new).and_return(faraday_connection)
    faraday_connection
  end
end
