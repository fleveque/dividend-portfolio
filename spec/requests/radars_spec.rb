RSpec.describe "Radars", type: :request do
  let(:user) { create(:user) }
  let(:stock) { create(:stock) }

  before do
    sign_in user
  end

  describe "GET /radar" do
    context "when user has no radar" do
      it "creates a new radar" do
        expect { get radar_path }.to change(Radar, :count).by(1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when user has a radar" do
      let!(:radar) { create(:radar, user: user) }

      it "shows existing radar" do
        get radar_path
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "POST /radar" do
    it "creates a new radar" do
      expect {
        post radar_path
      }.to change(Radar, :count).by(1)

      expect(response).to redirect_to(radar_path(Radar.last))
      expect(flash[:notice]).to eq("Radar was successfully created.")
    end
  end

  describe "PATCH /radar" do
    let!(:radar) { create(:radar, user: user) }

    context "when adding a stock" do
      it "adds stock to radar" do
        expect {
          patch radar_path(radar), params: { stock_id: stock.id, action_type: 'add' }
        }.to change { radar.reload.stocks.count }.by(1)

        expect(response).to redirect_to(radar_path(radar))
        expect(flash[:notice]).to eq("Stock was successfully added to radar.")
      end

      it "doesn't add duplicate stock" do
        radar.stocks << stock

        expect {
          patch radar_path(radar), params: { stock_id: stock.id, action_type: 'add' }
        }.not_to change { radar.reload.stocks.count }

        expect(response).to redirect_to(radar_path(radar))
      end
    end

    context "when removing a stock" do
      before { radar.stocks << stock }

      it "removes stock from radar" do
        expect {
          patch radar_path(radar), params: { stock_id: stock.id, action_type: 'remove' }
        }.to change { radar.reload.stocks.count }.by(-1)

        expect(response).to redirect_to(radar_path(radar))
        expect(flash[:notice]).to eq("Stock was successfully removed from radar.")
      end
    end
  end

  describe "GET /radar/search" do
    let!(:radar) { create(:radar, user: user) }

    before do
      allow(FinancialDataService).to receive(:get_stock).with("AAPL").and_return(stock)
    end

    it "returns search results" do
      get search_radar_path,
          params: { query: "AAPL" },
          headers: {
            'Accept': 'text/vnd.turbo-stream.html',
            'X-Requested-With': 'XMLHttpRequest'
          }

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq "text/vnd.turbo-stream.html"
    end

    it "handles empty search query" do
      get search_radar_path, params: { query: "" }, xhr: true
      expect(response).to have_http_status(:ok)
    end

    it "handles non-ajax requests" do
      get search_radar_path, params: { query: "AAPL" }
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq "text/html"
    end
  end
end
