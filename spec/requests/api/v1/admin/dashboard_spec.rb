RSpec.describe "Api::V1::Admin::Dashboard", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }

  describe "GET /api/v1/admin/dashboard" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated as regular user" do
      before { sign_in user }

      it "returns 403 forbidden" do
        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Forbidden")
      end
    end

    context "when authenticated as admin" do
      before { sign_in admin }

      it "returns dashboard stats" do
        # Create some data for stats
        create_list(:user, 2)
        create(:stock, symbol: "AAPL", price: 150.00)
        create(:stock, symbol: "GOOGL", price: nil)

        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true

        data = json["data"]
        expect(data["users"]["total"]).to eq(3) # admin + 2 users
        expect(data["users"]["admins"]).to eq(1)
        expect(data["stocks"]["total"]).to eq(2)
        expect(data["stocks"]["withPrice"]).to eq(1)
        expect(data["stocks"]["withoutPrice"]).to eq(1)
        expect(data["radars"]).to be_present
        expect(data["buyPlans"]).to be_present
        expect(data["transactions"]).to be_present
      end
    end
  end
end
