RSpec.describe "Api::V1::Holdings", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

  describe "GET /api/v1/holdings" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/holdings"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      before { sign_in user }

      it "returns empty holdings" do
        get "/api/v1/holdings"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["holdings"]).to eq([])
        expect(json["data"]["totalValue"]).to eq(0.0)
      end

      it "returns holdings with computed fields and stock data" do
        create(:holding, user: user, stock: stock, quantity: 10, average_price: 100.00)

        get "/api/v1/holdings"

        json = JSON.parse(response.body)
        holding = json["data"]["holdings"].first
        expect(holding["quantity"]).to eq(10.0)
        expect(holding["averagePrice"]).to eq(100.0)
        expect(holding["marketValue"]).to eq(1500.0)
        expect(holding["gainLoss"]).to eq(500.0)
        expect(holding["gainLossPercent"]).to eq(50.0)

        stock_data = holding["stock"]
        expect(stock_data["symbol"]).to eq("AAPL")
        expect(stock_data["name"]).to eq("Apple Inc.")
        expect(stock_data["formattedPrice"]).to eq("$150.00")
        expect(stock_data).to have_key("dividendScheduleAvailable")
        expect(stock_data).to have_key("paymentMonths")

        expect(json["data"]["totalValue"]).to eq(1500.0)
        expect(json["data"]["totalCost"]).to eq(1000.0)
        expect(json["data"]["totalGainLoss"]).to eq(500.0)
      end
    end
  end

  describe "POST /api/v1/holdings" do
    context "when authenticated" do
      before { sign_in user }

      it "creates a holding" do
        expect {
          post "/api/v1/holdings", params: { stock_id: stock.id, quantity: 5, average_price: 120.00 }, as: :json
        }.to change(Holding, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["data"]["symbol"]).to eq("AAPL")
        expect(json["data"]["quantity"]).to eq(5.0)
      end

      it "merges duplicate stock with weighted average price" do
        create(:holding, user: user, stock: stock, quantity: 10, average_price: 100.00)

        expect {
          post "/api/v1/holdings", params: { stock_id: stock.id, quantity: 10, average_price: 200.00 }, as: :json
        }.not_to change(Holding, :count)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["quantity"]).to eq(20.0)
        expect(json["data"]["averagePrice"]).to eq(150.0)
      end

      it "rejects invalid quantity" do
        post "/api/v1/holdings", params: { stock_id: stock.id, quantity: -1, average_price: 100.00 }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "POST /api/v1/holdings/import_from_cart" do
    context "when authenticated" do
      before { sign_in user }

      let(:stock2) { create(:stock, symbol: "MSFT", name: "Microsoft Corp.", price: 300.00) }

      it "imports cart items as new holdings using current stock prices" do
        expect {
          post "/api/v1/holdings/import_from_cart", params: {
            items: [
              { stock_id: stock.id, quantity: 5 },
              { stock_id: stock2.id, quantity: 3 }
            ]
          }
        }.to change(Holding, :count).by(2)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["imported"]).to eq(2)

        holding1 = user.holdings.find_by(stock: stock)
        expect(holding1.quantity).to eq(5)
        expect(holding1.average_price).to eq(150.00)

        holding2 = user.holdings.find_by(stock: stock2)
        expect(holding2.quantity).to eq(3)
        expect(holding2.average_price).to eq(300.00)
      end

      it "merges into existing holdings with weighted average" do
        create(:holding, user: user, stock: stock, quantity: 10, average_price: 100.00)

        expect {
          post "/api/v1/holdings/import_from_cart", params: {
            items: [ { stock_id: stock.id, quantity: 10 } ]
          }
        }.not_to change(Holding, :count)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["imported"]).to eq(1)

        holding = user.holdings.find_by(stock: stock)
        expect(holding.quantity).to eq(20)
        # (10 * 100 + 10 * 150) / 20 = 125
        expect(holding.average_price).to eq(125.00)
      end

      it "returns error when no items provided" do
        post "/api/v1/holdings/import_from_cart", params: {}, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "PATCH /api/v1/holdings/:id" do
    context "when authenticated" do
      before { sign_in user }
      let!(:holding) { create(:holding, user: user, stock: stock, quantity: 10, average_price: 100.00) }

      it "updates the holding" do
        patch "/api/v1/holdings/#{holding.id}", params: { quantity: 20, average_price: 110.00 }, as: :json

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["quantity"]).to eq(20.0)
        expect(json["data"]["averagePrice"]).to eq(110.0)
      end
    end
  end

  describe "DELETE /api/v1/holdings/:id" do
    context "when authenticated" do
      before { sign_in user }
      let!(:holding) { create(:holding, user: user, stock: stock) }

      it "deletes the holding" do
        expect {
          delete "/api/v1/holdings/#{holding.id}"
        }.to change(Holding, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end

      it "cannot delete another user's holding" do
        other_user = create(:user)
        other_holding = create(:holding, user: other_user, stock: stock)

        expect {
          delete "/api/v1/holdings/#{other_holding.id}"
        }.not_to change(Holding, :count)
      end
    end
  end
end
