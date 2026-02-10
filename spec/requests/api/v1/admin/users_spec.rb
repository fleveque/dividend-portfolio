RSpec.describe "Api::V1::Admin::Users", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }

  describe "GET /api/v1/admin/users" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/admin/users"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as regular user" do
      before { sign_in user }

      it "returns 403 forbidden" do
        get "/api/v1/admin/users"

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when authenticated as admin" do
      before { sign_in admin }

      it "returns all users with metadata" do
        other_user = create(:user)
        radar = create(:radar, user: other_user)
        stock = create(:stock, symbol: "AAPL")
        RadarStock.create!(radar: radar, stock: stock)

        get "/api/v1/admin/users"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"].length).to eq(2) # admin + other_user

        user_data = json["data"].find { |u| u["id"] == other_user.id }
        expect(user_data["emailAddress"]).to eq(other_user.email_address)
        expect(user_data["admin"]).to be false
        expect(user_data["radarStocksCount"]).to eq(1)
        expect(user_data["createdAt"]).to be_present
      end
    end
  end

  describe "DELETE /api/v1/admin/users/:id" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        delete "/api/v1/admin/users/#{user.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as regular user" do
      before { sign_in user }

      it "returns 403 forbidden" do
        other_user = create(:user)
        delete "/api/v1/admin/users/#{other_user.id}"

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when authenticated as admin" do
      before { sign_in admin }

      it "deletes the user" do
        target_user = create(:user)

        expect {
          delete "/api/v1/admin/users/#{target_user.id}"
        }.to change(User, :count).by(-1)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["deleted"]).to be true
      end

      it "prevents self-deletion" do
        expect {
          delete "/api/v1/admin/users/#{admin.id}"
        }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Cannot delete yourself")
      end

      it "returns 404 for non-existent user" do
        delete "/api/v1/admin/users/99999"

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
