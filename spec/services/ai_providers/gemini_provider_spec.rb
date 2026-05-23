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
      summary: "A balanced portfolio",
      buyingOpportunities: [ { symbol: "KO", reason: "Below target" } ],
      coverageGaps: "No coverage in Jan-Feb",
      riskFlags: [],
      strengths: [ "Good diversification" ]
    }.to_json
  end

  let(:gemini_stock_response) do
    {
      summary: "AAPL is a tech leader",
      verdict: "hold",
      keyPoints: [ "Low yield", "Strong growth" ]
    }.to_json
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

      it "calls the API every time (caching lives in AiInsightsService)" do
        http = stub_gemini_request(gemini_radar_response)

        provider.radar_insights(stocks_data)
        provider.radar_insights(stocks_data)

        expect(http).to have_received(:request).twice
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

  describe "#social_post" do
    let(:topic) do
      {
        category: "stock_of_the_day",
        topic_key: "AAPL",
        inputs: { symbol: "AAPL", dividend_yield: 0.6, dividend_score: 7 }
      }
    end

    let(:gemini_social_response) do
      {
        headline: "AAPL is paying its dividend",
        x: { text: "AAPL just paid its dividend — 0.6% yield isn't huge but the track record is rock solid. #dividends $AAPL" },
        linkedin: { text: "A short professional LinkedIn post about AAPL with some context and a closing thought." },
        hashtags: %w[dividends AAPL]
      }.to_json
    end

    it "returns the parsed payload from Gemini" do
      stub_gemini_request(gemini_social_response)

      result = provider.social_post(topic)

      expect(result[:headline]).to eq("AAPL is paying its dividend")
      expect(result[:x][:text]).to include("AAPL")
      expect(result[:linkedin][:text]).to include("LinkedIn")
      expect(result[:hashtags]).to include("dividends")
    end

    it "does NOT cache — each call hits Gemini fresh" do
      http = stub_gemini_request(gemini_social_response)

      provider.social_post(topic)
      provider.social_post(topic)

      expect(http).to have_received(:request).twice
    end

    it "raises AiError on a 500 from Gemini" do
      stub_gemini_error(500, "Internal Server Error")

      expect { provider.social_post(topic) }.to raise_error(
        AiProviders::BaseProvider::AiError, /Gemini API error/
      )
    end
  end

  private

  def stub_gemini_request(response_body)
    response = instance_double(Net::HTTPSuccess, body: wrap_gemini_response(response_body), code: "200", message: "OK")
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

    http = instance_double(Net::HTTP)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:open_timeout=)
    allow(http).to receive(:read_timeout=)
    allow(http).to receive(:request).and_return(response)

    allow(Net::HTTP).to receive(:new).and_return(http)
    http
  end

  def stub_gemini_error(status, message)
    response = instance_double(Net::HTTPResponse, body: { "error" => { "message" => message } }.to_json, code: status.to_s, message: message)
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)

    http = instance_double(Net::HTTP)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:open_timeout=)
    allow(http).to receive(:read_timeout=)
    allow(http).to receive(:request).and_return(response)

    allow(Net::HTTP).to receive(:new).and_return(http)
    http
  end

  def wrap_gemini_response(text)
    {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              { "text" => text }
            ]
          }
        }
      ]
    }.to_json
  end
end
