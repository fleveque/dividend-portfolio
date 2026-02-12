RSpec.describe "Api::V1::Stocks", type: :request do
  describe "GET /api/v1/stocks" do
    let!(:stocks) { create_list(:stock, 3) }

    it "returns all stocks" do
      get "/api/v1/stocks"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["data"].length).to eq(3)
    end

    it "returns stock data with expected fields" do
      get "/api/v1/stocks"

      json = JSON.parse(response.body)
      stock_data = json["data"].first
      expect(stock_data).to include(
        "id", "symbol", "name", "price", "formattedPrice",
        "formattedPeRatio", "formattedEps", "formattedDividend",
        "formattedDividendYield", "formattedPayoutRatio",
        "formattedMa50", "formattedMa200",
        "dividendScore", "dividendScoreLabel",
        "paymentMonths", "dividendScheduleAvailable"
      )
    end
  end

  describe "GET /api/v1/stocks/:id" do
    let!(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

    it "returns the stock" do
      get "/api/v1/stocks/#{stock.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["data"]["symbol"]).to eq("AAPL")
      expect(json["data"]["formattedPrice"]).to eq("$150.00")
    end

    it "returns 404 for non-existent stock" do
      get "/api/v1/stocks/99999"

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
      expect(json["error"]).to eq("Not found")
    end
  end

  describe "GET /api/v1/stocks/last_added" do
    let!(:old_stock) { create(:stock, created_at: 2.days.ago) }
    let!(:new_stock) { create(:stock, created_at: 1.hour.ago) }

    it "returns stocks ordered by creation date (newest first)" do
      get "/api/v1/stocks/last_added"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"].first["id"]).to eq(new_stock.id)
    end
  end

  describe "GET /api/v1/stocks/most_added" do
    let!(:popular_stock) { create(:stock, symbol: "AAPL") }
    let!(:unpopular_stock) { create(:stock, symbol: "XYZ") }
    let!(:radars) { create_list(:radar, 3) }

    before do
      radars.each { |radar| RadarStock.create!(radar: radar, stock: popular_stock) }
      RadarStock.create!(radar: radars.first, stock: unpopular_stock)
    end

    it "returns stocks ordered by popularity" do
      get "/api/v1/stocks/most_added"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"].first["symbol"]).to eq("AAPL")
    end
  end

  describe "GET /api/v1/stocks/search" do
    let!(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.") }

    before do
      allow(FinancialDataService).to receive(:get_stock).with("AAPL").and_return(stock)
      allow(FinancialDataService).to receive(:get_stock).with("INVALID").and_return(nil)
    end

    it "returns matching stocks" do
      get "/api/v1/stocks/search", params: { query: "AAPL" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"].length).to eq(1)
      expect(json["data"].first["symbol"]).to eq("AAPL")
    end

    it "returns stock metrics in search results" do
      get "/api/v1/stocks/search", params: { query: "AAPL" }

      json = JSON.parse(response.body)
      stock_data = json["data"].first
      expect(stock_data).to include(
        "formattedPeRatio", "formattedEps", "formattedDividend",
        "dividendScore", "dividendScoreLabel",
        "paymentMonths", "dividendScheduleAvailable"
      )
    end

    it "returns empty array for no results" do
      get "/api/v1/stocks/search", params: { query: "INVALID" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
    end

    it "returns empty array for empty query" do
      get "/api/v1/stocks/search", params: { query: "" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
    end
  end
end
