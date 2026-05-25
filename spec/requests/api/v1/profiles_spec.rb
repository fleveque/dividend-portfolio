RSpec.describe "Api::V1::Profiles", type: :request do
  let(:user) { create(:user) }

  describe "GET /api/v1/profile" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/profile"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      before { sign_in user }

      it "returns the user profile" do
        get "/api/v1/profile"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["emailAddress"]).to eq(user.email_address)
        expect(json["data"]["portfolioSlug"]).to be_nil
        expect(json["data"]["preferredCurrency"]).to eq("USD")
      end
    end
  end

  describe "PATCH /api/v1/profile" do
    context "when authenticated" do
      before { sign_in user }

      it "updates the portfolio slug" do
        patch "/api/v1/profile", params: { portfolio_slug: "my-portfolio" }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["portfolioSlug"]).to eq("my-portfolio")
        expect(user.reload.portfolio_slug).to eq("my-portfolio")
      end

      it "clears the portfolio slug" do
        user.update!(portfolio_slug: "old-slug")

        patch "/api/v1/profile", params: { portfolio_slug: "" }

        expect(response).to have_http_status(:ok)
        expect(user.reload.portfolio_slug).to be_nil
      end

      it "rejects invalid slug format" do
        patch "/api/v1/profile", params: { portfolio_slug: "AB" }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "updates the preferred currency" do
        patch "/api/v1/profile", params: { preferred_currency: "EUR" }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]["preferredCurrency"]).to eq("EUR")
        expect(user.reload.preferred_currency).to eq("EUR")
      end

      it "rejects an unsupported currency" do
        patch "/api/v1/profile", params: { preferred_currency: "XYZ" }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "exposes and updates the sharePortfolio / shareRadar toggles" do
        get "/api/v1/profile"
        json = JSON.parse(response.body)["data"]
        expect(json["sharePortfolio"]).to be(true)  # default
        expect(json["shareRadar"]).to be(false)     # default

        patch "/api/v1/profile", params: { share_radar: true, share_portfolio: false }
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)["data"]
        expect(json["sharePortfolio"]).to be(false)
        expect(json["shareRadar"]).to be(true)
      end

      it "accepts string booleans (form-style clients)" do
        patch "/api/v1/profile", params: { share_radar: "true" }
        expect(JSON.parse(response.body)["data"]["shareRadar"]).to be(true)
      end
    end
  end
end
