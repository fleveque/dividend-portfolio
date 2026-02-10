RSpec.describe "Api::V1::Admin::Stocks", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }

  describe "POST /api/v1/admin/stocks/refresh" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        post "/api/v1/admin/stocks/refresh"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as regular user" do
      before { sign_in user }

      it "returns 403 forbidden" do
        post "/api/v1/admin/stocks/refresh"

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when authenticated as admin" do
      before { sign_in admin }

      it "enqueues RefreshStocksJob" do
        expect {
          post "/api/v1/admin/stocks/refresh"
        }.to have_enqueued_job(RefreshStocksJob)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["enqueued"]).to be true
      end
    end
  end
end
