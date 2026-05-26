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
        expect(json["data"]["locale"]).to eq("en")
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

      it "updates the locale" do
        patch "/api/v1/profile", params: { locale: "es" }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["data"]["locale"]).to eq("es")
        expect(user.reload.locale).to eq("es")
      end

      it "rejects an unsupported locale" do
        patch "/api/v1/profile", params: { locale: "fr" }

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

      it "exposes the motivation inputs (nil by default, default inflation)" do
        get "/api/v1/profile"
        data = JSON.parse(response.body)["data"]
        expect(data["motivationMonthlyInvest"]).to be_nil
        expect(data["motivationMonthlyObjective"]).to be_nil
        expect(data["motivationInflationPct"]).to eq(2.5)
        expect(data["motivationYieldOverridePct"]).to be_nil
        expect(data["motivationStartYear"]).to be_nil
      end

      it "updates and clears the motivation_start_year field" do
        patch "/api/v1/profile", params: { motivation_start_year: "2018" }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["data"]["motivationStartYear"]).to eq(2018)

        patch "/api/v1/profile", params: { motivation_start_year: "" }
        expect(JSON.parse(response.body)["data"]["motivationStartYear"]).to be_nil
      end

      it "rejects a non-integer motivation_start_year" do
        patch "/api/v1/profile", params: { motivation_start_year: "1800" }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "updates the motivation inputs" do
        patch "/api/v1/profile", params: {
          motivation_monthly_invest: "1500.50",
          motivation_monthly_objective: "2500",
          motivation_inflation_pct: "3.0",
          motivation_yield_override_pct: "4.5"
        }

        expect(response).to have_http_status(:ok)
        data = JSON.parse(response.body)["data"]
        expect(data["motivationMonthlyInvest"]).to eq(1500.5)
        expect(data["motivationMonthlyObjective"]).to eq(2500.0)
        expect(data["motivationInflationPct"]).to eq(3.0)
        expect(data["motivationYieldOverridePct"]).to eq(4.5)
      end

      it "clears a motivation field when sent as empty string" do
        user.update!(motivation_yield_override_pct: 5)

        patch "/api/v1/profile", params: { motivation_yield_override_pct: "" }

        expect(response).to have_http_status(:ok)
        expect(user.reload.motivation_yield_override_pct).to be_nil
      end

      it "rejects a negative monthly invest" do
        patch "/api/v1/profile", params: { motivation_monthly_invest: "-5" }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
