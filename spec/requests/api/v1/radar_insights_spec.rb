RSpec.describe "Api::V1::Radars#insights", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

  let(:insights_result) do
    {
      summary: "Your portfolio has 1 stock",
      buyingOpportunities: [ { symbol: "AAPL", reason: "Below target price" } ],
      coverageGaps: "Most months lack dividend income",
      riskFlags: [],
      strengths: [ "Strong tech exposure" ]
    }
  end

  describe "GET /api/v1/radar/insights" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/radar/insights"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated" do
      before { sign_in user }

      context "when user has stocks on radar" do
        let!(:radar) { create(:radar, user: user) }
        let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 140.00) }

        before do
          allow(AiInsightsService).to receive(:radar_insights).and_return(insights_result)
        end

        it "returns AI-generated insights" do
          get "/api/v1/radar/insights"

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["success"]).to be true
          expect(json["data"]["summary"]).to eq("Your portfolio has 1 stock")
          expect(json["data"]["buyingOpportunities"].length).to eq(1)
          expect(json["data"]["strengths"]).to include("Strong tech exposure")
        end

        it "passes serialized stock data to the service" do
          get "/api/v1/radar/insights"

          expect(AiInsightsService).to have_received(:radar_insights) do |stocks_data|
            expect(stocks_data.length).to eq(1)
            expect(stocks_data.first[:symbol]).to eq("AAPL")
            expect(stocks_data.first[:price]).to eq(150.0)
            expect(stocks_data.first[:targetPrice]).to eq(140.0)
          end
        end
      end

      context "when user has empty radar" do
        before do
          allow(AiInsightsService).to receive(:radar_insights).and_return(insights_result)
        end

        it "returns insights for empty portfolio" do
          get "/api/v1/radar/insights"

          expect(response).to have_http_status(:ok)
          expect(AiInsightsService).to have_received(:radar_insights).with([])
        end
      end

      context "when AI service fails" do
        let!(:radar) { create(:radar, user: user) }
        let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock) }

        before do
          allow(AiInsightsService).to receive(:radar_insights)
            .and_raise(AiProviders::BaseProvider::AiError, "API rate limited")
        end

        it "returns 503 service unavailable" do
          get "/api/v1/radar/insights"

          expect(response).to have_http_status(:service_unavailable)
          json = JSON.parse(response.body)
          expect(json["success"]).to be false
          expect(json["error"]).to eq("AI insights temporarily unavailable")
        end
      end
    end
  end
end
