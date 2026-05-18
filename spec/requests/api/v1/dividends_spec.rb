require "rails_helper"

RSpec.describe "Api::V1::Dividends", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "NKE", isin: "US6541061031") }

  before { sign_in user }

  describe "GET /api/v1/dividends" do
    it "returns the user's dividends in reverse chronological order" do
      _old = create(:dividend, user: user, stock: stock, date: 90.days.ago)
      newer = create(:dividend, user: user, stock: stock, date: 10.days.ago)

      get "/api/v1/dividends"
      data = JSON.parse(response.body)["data"]
      expect(data.first["id"]).to eq(newer.id)
    end

    it "does not leak other users' dividends" do
      other = create(:user)
      create(:dividend, user: other, stock: stock)
      get "/api/v1/dividends"
      expect(JSON.parse(response.body)["data"]).to be_empty
    end
  end

  describe "POST /api/v1/dividends" do
    it "creates a manual dividend" do
      post "/api/v1/dividends", params: {
        dividend: {
          stock_id: stock.id, date: "2025-05-01", per_share_amount: 0.5,
          quantity: 10, amount: 5.0, currency: "USD", withholding_tax: 0.75
        }
      }, as: :json

      expect(response).to have_http_status(:created)
      div = Dividend.last
      expect(div.source).to eq("manual")
      expect(div.amount).to eq(5.0)
    end
  end

  describe "DELETE /api/v1/dividends/:id" do
    it "deletes manual rows" do
      div = create(:dividend, user: user, stock: stock, source: "manual")
      delete "/api/v1/dividends/#{div.id}"
      expect(response).to have_http_status(:ok)
      expect(Dividend.exists?(div.id)).to be false
    end

    it "refuses to delete imported rows" do
      div = create(:dividend, :ibkr, user: user, stock: stock)
      delete "/api/v1/dividends/#{div.id}"
      expect(response).to have_http_status(:unprocessable_entity)
      expect(Dividend.exists?(div.id)).to be true
    end
  end

  describe "POST /api/v1/dividends/import_preview" do
    let(:fixture) { Rails.root.join("spec/fixtures/files/ibkr_activity_statement_es.csv") }

    it "parses and returns a preview" do
      skip "fixture missing" unless File.exist?(fixture)

      post "/api/v1/dividends/import_preview",
           params: { file: Rack::Test::UploadedFile.new(fixture, "text/csv") }

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)["data"]
      expect(data).to include("language", "resolved", "unmatched", "skipped")
    end
  end

  describe "POST /api/v1/dividends/import_apply" do
    let(:row) do
      {
        ticker: "NKE", stock_id: stock.id, currency: "USD",
        date: "2025-01-02", per_share_amount: "0.40",
        amount: "2.8", quantity: 7, withholding_tax: "0.42"
      }
    end

    it "creates imported dividends and reports counts" do
      post "/api/v1/dividends/import_apply",
           params: { rows: [ row ] }, as: :json

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)["data"]
      expect(data).to eq("created" => 1, "updated" => 0, "skipped" => 0)
    end
  end
end
