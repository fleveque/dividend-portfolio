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

      context "with stocks on radar" do
        before do
          RadarStock.create!(radar: radar, stock: stock, target_price: 150.00)
        end

        it "displays stocks" do
          get radar_path
          expect(response).to have_http_status(:ok)
          expect(response.body).to include(stock.symbol)
        end
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
        RadarStock.create!(radar: radar, stock: stock, target_price: 100.00)

        expect {
          patch radar_path(radar), params: { stock_id: stock.id, action_type: 'add' }
        }.not_to change { radar.reload.stocks.count }

        expect(response).to redirect_to(radar_path(radar))
      end
    end

    context "when removing a stock" do
      before { RadarStock.create!(radar: radar, stock: stock, target_price: 100.00) }

      it "removes stock from radar" do
        expect {
          patch radar_path(radar), params: { stock_id: stock.id, action_type: 'remove' }
        }.to change { radar.reload.stocks.count }.by(-1)

        expect(response).to redirect_to(radar_path(radar))
        expect(flash[:notice]).to eq("Stock was successfully removed from radar.")
      end
    end

    context "when updating target price" do
      let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 100.00) }

      it "updates target price" do
        patch radar_path(radar), params: {
          stock_id: stock.id,
          target_price: '175.50'
        }

        expect(response).to redirect_to(radar_path(radar))
        expect(flash[:notice]).to eq("Target price was successfully updated.")
        expect(radar_stock.reload.target_price).to eq(BigDecimal('175.50'))
      end

      it "handles non-existent stock gracefully" do
        patch radar_path(radar), params: {
          stock_id: 99999,
          target_price: '150.00'
        }

        expect(response).to redirect_to(radar_path(radar))
        expect(flash[:alert]).to eq("Stock not found.")
      end
    end
  end

  describe "GET /radar/search" do
    let!(:radar) { create(:radar, user: user) }

    before do
      allow(FinancialDataService).to receive(:get_stock).with("AAPL").and_return(stock)
    end

    it "handles search requests" do
      get search_radar_path, params: { query: "AAPL" }
      expect(response).to have_http_status(:ok)
    end

    it "handles empty search query" do
      get search_radar_path, params: { query: "" }
      expect(response).to have_http_status(:ok)
    end
  end
end
