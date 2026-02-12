RSpec.describe "Api::V1::Radars", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

  describe "GET /api/v1/radar" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/radar"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated" do
      before { sign_in user }

      context "when user has no radar" do
        it "creates a radar and returns empty stocks" do
          expect { get "/api/v1/radar" }.to change(Radar, :count).by(1)

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["success"]).to be true
          expect(json["data"]["stocks"]).to eq([])
        end
      end

      context "when user has a radar with stocks" do
        let!(:radar) { create(:radar, user: user) }
        let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 140.00) }

        it "returns radar with stocks" do
          get "/api/v1/radar"

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["data"]["stocks"].length).to eq(1)

          stock_data = json["data"]["stocks"].first
          expect(stock_data["symbol"]).to eq("AAPL")
          expect(stock_data["targetPrice"]).to eq(140.0)
          expect(stock_data["formattedTargetPrice"]).to eq("$140.00")
          expect(stock_data["belowTarget"]).to be false
          expect(stock_data["aboveTarget"]).to be true
        end
      end

      context "when stock has dividend schedule data" do
        let(:dividend_stock) { create(:stock, :with_dividend_schedule, symbol: "JNJ", name: "Johnson & Johnson") }
        let!(:radar) { create(:radar, user: user) }
        let!(:radar_stock) { RadarStock.create!(radar: radar, stock: dividend_stock) }

        it "returns dividend schedule fields" do
          get "/api/v1/radar"

          stock_data = JSON.parse(response.body)["data"]["stocks"].first
          expect(stock_data["exDividendDate"]).to eq("2024-03-15")
          expect(stock_data["paymentFrequency"]).to eq("quarterly")
          expect(stock_data["paymentMonths"]).to eq([ 3, 6, 9, 12 ])
          expect(stock_data["dividendPerPayment"]).to eq(0.25)
          expect(stock_data["formattedDividendPerPayment"]).to eq("$0.25")
          expect(stock_data["formattedPaymentFrequency"]).to eq("Quarterly")
          expect(stock_data["formattedExDividendDate"]).to eq("Mar 15, 2024")
          expect(stock_data["dividendScheduleAvailable"]).to be true
        end
      end
    end
  end

  describe "POST /api/v1/radar/stocks/:stock_id" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        post "/api/v1/radar/stocks/#{stock.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      before { sign_in user }
      let!(:radar) { create(:radar, user: user) }

      it "adds stock to radar" do
        expect {
          post "/api/v1/radar/stocks/#{stock.id}"
        }.to change { radar.reload.stocks.count }.by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["symbol"]).to eq("AAPL")
      end

      it "adds stock with target price" do
        post "/api/v1/radar/stocks/#{stock.id}", params: { target_price: 145.00 }

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["data"]["targetPrice"].to_f).to eq(145.0)
      end

      it "returns error for duplicate stock" do
        RadarStock.create!(radar: radar, stock: stock)

        post "/api/v1/radar/stocks/#{stock.id}"

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Stock already on radar")
      end

      it "returns 404 for non-existent stock" do
        post "/api/v1/radar/stocks/99999"

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/v1/radar/stocks/:stock_id" do
    context "when authenticated" do
      before { sign_in user }
      let!(:radar) { create(:radar, user: user) }
      let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock) }

      it "removes stock from radar" do
        expect {
          delete "/api/v1/radar/stocks/#{stock.id}"
        }.to change { radar.reload.stocks.count }.by(-1)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["removed"]).to be true
      end
    end
  end

  describe "PATCH /api/v1/radar/stocks/:stock_id/target_price" do
    context "when authenticated" do
      before { sign_in user }
      let!(:radar) { create(:radar, user: user) }
      let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 140.00) }

      it "updates target price" do
        patch "/api/v1/radar/stocks/#{stock.id}/target_price", params: { target_price: 160.00 }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["targetPrice"].to_f).to eq(160.0)
        expect(radar_stock.reload.target_price).to eq(BigDecimal("160.0"))
      end

      it "clears target price when given nil" do
        patch "/api/v1/radar/stocks/#{stock.id}/target_price", params: { target_price: nil }

        expect(response).to have_http_status(:ok)
        expect(radar_stock.reload.target_price).to be_nil
      end

      it "returns error for stock not on radar" do
        other_stock = create(:stock, symbol: "GOOGL")

        patch "/api/v1/radar/stocks/#{other_stock.id}/target_price", params: { target_price: 100.00 }

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Stock not found on radar")
      end
    end
  end
end
