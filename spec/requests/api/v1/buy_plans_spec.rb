RSpec.describe "Api::V1::BuyPlans", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }
  let(:stock2) { create(:stock, symbol: "MSFT", name: "Microsoft", price: 400.00) }

  describe "GET /api/v1/buy_plan" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/buy_plan"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated" do
      before { sign_in user }

      context "when user has no buy plan" do
        it "creates a buy plan and returns empty items" do
          expect { get "/api/v1/buy_plan" }.to change(BuyPlan, :count).by(1)

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["success"]).to be true
          expect(json["data"]["items"]).to eq([])
          expect(json["data"]["totalItems"]).to eq(0)
          expect(json["data"]["totalEstimatedCost"]).to eq(0)
        end
      end

      context "when user has a buy plan with items" do
        let!(:buy_plan) { create(:buy_plan, user: user) }
        let!(:item1) { create(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 10) }
        let!(:item2) { create(:buy_plan_item, buy_plan: buy_plan, stock: stock2, quantity: 5) }

        it "returns buy plan with items" do
          get "/api/v1/buy_plan"

          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          expect(json["data"]["items"].length).to eq(2)
          expect(json["data"]["totalItems"]).to eq(15)
          expect(json["data"]["totalEstimatedCost"]).to eq(3500.00)
        end

        it "returns correct item data" do
          get "/api/v1/buy_plan"

          json = JSON.parse(response.body)
          apple_item = json["data"]["items"].find { |i| i["symbol"] == "AAPL" }

          expect(apple_item["stockId"]).to eq(stock.id)
          expect(apple_item["quantity"]).to eq(10)
          expect(apple_item["currentPrice"]).to eq(150.0)
          expect(apple_item["subtotal"]).to eq(1500.0)
          expect(apple_item["formattedPrice"]).to eq("$150.00")
          expect(apple_item["formattedSubtotal"]).to eq("$1,500.00")
        end
      end
    end
  end

  describe "POST /api/v1/buy_plan/save" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        post "/api/v1/buy_plan/save"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      before { sign_in user }
      let!(:buy_plan) { create(:buy_plan, user: user) }

      it "saves cart items" do
        post "/api/v1/buy_plan/save", params: {
          items: [
            { stockId: stock.id, quantity: 10 },
            { stockId: stock2.id, quantity: 5 }
          ]
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["items"].length).to eq(2)
        expect(json["data"]["totalItems"]).to eq(15)
      end

      it "replaces existing items" do
        create(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 100)

        post "/api/v1/buy_plan/save", params: {
          items: [
            { stockId: stock2.id, quantity: 5 }
          ]
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["items"].length).to eq(1)
        expect(json["data"]["items"].first["symbol"]).to eq("MSFT")
      end

      it "clears cart when given empty items" do
        create(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 10)

        post "/api/v1/buy_plan/save", params: { items: [] }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["items"]).to eq([])
        expect(json["data"]["totalItems"]).to eq(0)
      end

      it "returns error for invalid quantity" do
        post "/api/v1/buy_plan/save", params: {
          items: [
            { stockId: stock.id, quantity: 0 }
          ]
        }

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
      end

      it "returns 404 for non-existent stock" do
        post "/api/v1/buy_plan/save", params: {
          items: [
            { stockId: 99999, quantity: 10 }
          ]
        }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/v1/buy_plan" do
    context "when authenticated" do
      before { sign_in user }
      let!(:buy_plan) { create(:buy_plan, user: user) }
      let!(:item) { create(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 10) }

      it "clears all items from buy plan" do
        expect {
          delete "/api/v1/buy_plan"
        }.to change { buy_plan.reload.buy_plan_items.count }.by(-1)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["reset"]).to be true
      end

      it "does not delete the buy plan itself" do
        expect {
          delete "/api/v1/buy_plan"
        }.not_to change(BuyPlan, :count)
      end
    end
  end
end
