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
        "paymentMonths", "dividendScheduleAvailable",
        "fiftyTwoWeekDataAvailable"
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

  describe "GET /api/v1/stocks/top_scored" do
    it "returns stocks with dividend score >= 5" do
      # Stock with high score: yield >= 3 (2pts), payout <= 60 (2pts), pe <= 15 (2pts) = 6
      create(:stock, symbol: "HIGH",
        price: 100.00, dividend_yield: 4.0, payout_ratio: 50.0, pe_ratio: 12.0)
      # Stock with low score: no metrics = 0
      create(:stock, symbol: "LOW", price: 50.00)

      get "/api/v1/stocks/top_scored"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      symbols = json["data"].map { |s| s["symbol"] }
      expect(symbols).to include("HIGH")
      expect(symbols).not_to include("LOW")
    end

    it "returns empty array when no stocks qualify" do
      create(:stock, symbol: "LOW", price: 50.00)

      get "/api/v1/stocks/top_scored"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
    end
  end

  describe "GET /api/v1/stocks/search" do
    let!(:db_stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.") }

    context "with a DB-only match" do
      before do
        allow(FinancialDataService).to receive(:search_stocks).with("AAPL").and_return(
          [ { symbol: "AAPL", name: "Apple Inc.", exchange: nil, type: "EQUITY",
             stock_id: db_stock.id, in_db: true } ]
        )
      end

      it "returns the lightweight shape with stockId and inDb: true" do
        get "/api/v1/stocks/search", params: { query: "AAPL" }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["data"]).to eq(
          [ { "symbol" => "AAPL", "name" => "Apple Inc.", "exchange" => nil,
             "type" => "EQUITY", "stockId" => db_stock.id, "inDb" => true } ]
        )
      end
    end

    context "with a provider-only match" do
      before do
        allow(FinancialDataService).to receive(:search_stocks).with("MSFT").and_return(
          [ { symbol: "MSFT", name: "Microsoft", exchange: "NasdaqGS", type: "EQUITY",
             stock_id: nil, in_db: false } ]
        )
      end

      it "returns stockId: nil and inDb: false" do
        get "/api/v1/stocks/search", params: { query: "MSFT" }

        json = JSON.parse(response.body)
        expect(json["data"].first).to eq(
          "symbol" => "MSFT", "name" => "Microsoft", "exchange" => "NasdaqGS",
          "type" => "EQUITY", "stockId" => nil, "inDb" => false
        )
      end
    end

    it "returns empty array for empty query" do
      get "/api/v1/stocks/search", params: { query: "" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
    end

    it "returns 200 with [] when the provider raises" do
      allow(FinancialDataService).to receive(:search_stocks).and_raise(StandardError.new("boom"))
      get "/api/v1/stocks/search", params: { query: "AAPL" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
    end
  end

  describe "POST /api/v1/stocks/resolve" do
    let!(:stock) { create(:stock, symbol: "AAPL", name: "Apple Inc.", price: 150.00) }

    it "returns the full serialized stock for a valid symbol" do
      allow(FinancialDataService).to receive(:get_stock).with("AAPL").and_return(stock)

      post "/api/v1/stocks/resolve", params: { symbol: "AAPL" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["data"]["symbol"]).to eq("AAPL")
      expect(json["data"]["formattedPrice"]).to eq("$150.00")
    end

    it "returns 404 for an unknown symbol" do
      allow(FinancialDataService).to receive(:get_stock).with("ZZZZ").and_return(nil)

      post "/api/v1/stocks/resolve", params: { symbol: "ZZZZ" }

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
      expect(json["error"]).to eq("Stock not found")
    end

    it "returns 422 when symbol is missing" do
      post "/api/v1/stocks/resolve", params: {}

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
      expect(json["error"]).to eq("Symbol required")
    end

    it "returns 422 when symbol is blank" do
      post "/api/v1/stocks/resolve", params: { symbol: "   " }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
