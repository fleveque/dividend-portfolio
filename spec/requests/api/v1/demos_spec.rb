require "rails_helper"

RSpec.describe "Api::V1::Demos", type: :request do
  describe "GET /api/v1/demo" do
    it "responds with 200 even when unauthenticated" do
      get "/api/v1/demo"
      expect(response).to have_http_status(:ok)
    end

    it "returns the radar / holdings / dividends / chart sections" do
      get "/api/v1/demo"
      data = JSON.parse(response.body)["data"]
      expect(data.keys).to contain_exactly("radar", "holdings", "dividends", "chart", "chartFull")
    end

    it "ships a non-empty radar with target anchors per stock" do
      get "/api/v1/demo"
      stocks = JSON.parse(response.body)["data"]["radar"]["stocks"]
      expect(stocks).not_to be_empty
      expect(stocks.first.keys).to include("symbol", "name", "currency", "price", "targetPrice", "targetAnchors")
      expect(stocks.first["targetAnchors"].keys).to contain_exactly("community", "fiftyTwoWeekMidpoint", "ma200", "ma50")
    end

    it "ships holdings with portfolio stats + per-currency totals" do
      get "/api/v1/demo"
      payload = JSON.parse(response.body)["data"]["holdings"]
      expect(payload["holdings"]).not_to be_empty
      expect(payload["totalsByCurrency"]).to have_key("USD")
      expect(payload["portfolioStats"]).to include("displayYoc", "displayCurrentYield", "sectors")
    end

    it "ships dividends with both manual and ibkr sources for visual variety" do
      get "/api/v1/demo"
      dividends = JSON.parse(response.body)["data"]["dividends"]
      sources = dividends.map { |d| d["source"] }.uniq
      expect(sources).to include("manual", "ibkr")
    end

    it "writes nothing to the database" do
      expect {
        get "/api/v1/demo"
      }.not_to change { [ Stock.count, Holding.count, RadarStock.count, Dividend.count, User.count ] }
    end
  end
end
