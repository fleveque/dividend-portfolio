RSpec.describe "Api::V1::Stocks#ai_summary", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

  let(:summary_result) do
    {
      summary: "AAPL is a solid dividend growth stock",
      verdict: "buy",
      keyPoints: [ "Low payout ratio", "Consistent dividend growth" ]
    }
  end

  describe "GET /api/v1/stocks/:id/ai_summary" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/stocks/#{stock.id}/ai_summary"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated" do
      before { sign_in user }

      context "when stock exists" do
        before do
          allow(AiInsightsService).to receive(:stock_summary).and_return(summary_result)
        end

        it "returns AI-generated summary" do
          get "/api/v1/stocks/#{stock.id}/ai_summary"

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["success"]).to be true
          expect(json["data"]["summary"]).to eq("AAPL is a solid dividend growth stock")
          expect(json["data"]["verdict"]).to eq("buy")
          expect(json["data"]["keyPoints"].length).to eq(2)
        end
      end

      context "when user has stock on radar with target price" do
        let!(:radar) { create(:radar, user: user) }
        let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 140.00) }

        before do
          allow(AiInsightsService).to receive(:stock_summary).and_return(summary_result)
        end

        it "includes target price in stock data sent to AI" do
          get "/api/v1/stocks/#{stock.id}/ai_summary"

          expect(AiInsightsService).to have_received(:stock_summary) do |stock_data|
            expect(stock_data[:targetPrice]).to eq(140.0)
          end
        end
      end

      context "when stock does not exist" do
        it "returns 404" do
          get "/api/v1/stocks/99999/ai_summary"

          expect(response).to have_http_status(:not_found)
        end
      end

      context "when AI service fails" do
        before do
          allow(AiInsightsService).to receive(:stock_summary)
            .and_raise(AiProviders::BaseProvider::AiError, "API error")
        end

        it "returns 503 service unavailable" do
          get "/api/v1/stocks/#{stock.id}/ai_summary"

          expect(response).to have_http_status(:service_unavailable)
          json = JSON.parse(response.body)
          expect(json["success"]).to be false
          expect(json["error"]).to eq("AI summary temporarily unavailable")
        end
      end
    end
  end
end
