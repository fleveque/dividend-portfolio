RSpec.describe Radar, type: :model do
  let(:user) { create(:user) }
  let(:radar) { create(:radar, user: user) }

  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:radar_stocks).dependent(:destroy) }
    it { should have_many(:stocks).through(:radar_stocks) }
  end

  describe "#sorted_stocks" do
    let(:stock1) { create(:stock, symbol: 'AAPL', price: 150.00) }
    let(:stock2) { create(:stock, symbol: 'GOOGL', price: 100.00) }
    let(:stock3) { create(:stock, symbol: 'MSFT', price: 200.00) }

    before do
      # Create radar_stocks with different target prices and scenarios
      RadarStock.create!(radar: radar, stock: stock1, target_price: 160.00)  # Below target (good)
      RadarStock.create!(radar: radar, stock: stock2, target_price: 90.00)   # Above target (bad)
      RadarStock.create!(radar: radar, stock: stock3, target_price: nil)     # No target
    end

    it "returns stocks with target_price information from join table" do
      sorted_stocks = radar.sorted_stocks

      expect(sorted_stocks.length).to eq(3)

      # Find each stock in the results
      apple_stock = sorted_stocks.find { |s| s.symbol == 'AAPL' }
      google_stock = sorted_stocks.find { |s| s.symbol == 'GOOGL' }
      microsoft_stock = sorted_stocks.find { |s| s.symbol == 'MSFT' }

      # Check target prices are properly loaded
      expect(apple_stock.target_price).to eq(BigDecimal('160.00'))
      expect(google_stock.target_price).to eq(BigDecimal('90.00'))
      expect(microsoft_stock.target_price).to be_nil
    end

    it "sorts stocks by performance against target price" do
      sorted_stocks = radar.sorted_stocks

      # Expected order:
      # 1. AAPL (150 vs 160 target = below target = good performance)
      # 2. MSFT (no target = middle priority)
      # 3. GOOGL (100 vs 90 target = above target = poor performance)

      expect(sorted_stocks.first.symbol).to eq('AAPL')
      expect(sorted_stocks.second.symbol).to eq('MSFT')
      expect(sorted_stocks.last.symbol).to eq('GOOGL')
    end

    it "handles edge cases in sorting" do
      # Clear existing stocks
      radar.radar_stocks.destroy_all

      # Add stocks with edge case scenarios
      stock_at_target = create(:stock, symbol: 'TSLA', price: 100.00)
      stock_way_below = create(:stock, symbol: 'META', price: 50.00)

      RadarStock.create!(radar: radar, stock: stock_at_target, target_price: 100.00)  # Exactly at target
      RadarStock.create!(radar: radar, stock: stock_way_below, target_price: 150.00)  # Way below target

      sorted_stocks = radar.sorted_stocks
      expect(sorted_stocks.length).to eq(2)

      # Way below target should come first (better performance)
      expect(sorted_stocks.first.symbol).to eq('META')
      expect(sorted_stocks.last.symbol).to eq('TSLA')
    end
  end

  describe ".most_added_stocks" do
    let(:stock1) { create(:stock) }
    let(:stock2) { create(:stock) }
    let(:stock3) { create(:stock) }
    let(:radar1) { create(:radar) }
    let(:radar2) { create(:radar) }

    before do
      # Use radar_stocks instead of direct association
      RadarStock.create!(radar: radar1, stock: stock1)
      RadarStock.create!(radar: radar1, stock: stock2)
      RadarStock.create!(radar: radar2, stock: stock1)
      RadarStock.create!(radar: radar2, stock: stock3)
    end

    it "returns the most added stocks" do
      most_added_stocks = Radar.most_added_stocks(2)

      expect(most_added_stocks).to include(stock1)
      expect(most_added_stocks.length).to eq(2)

      # Stock1 should be first (appears in 2 radars)
      expect(most_added_stocks.first).to eq(stock1)
    end

    it "respects the limit parameter" do
      most_added_stocks = Radar.most_added_stocks(1)
      expect(most_added_stocks.length).to eq(1)
      expect(most_added_stocks.first).to eq(stock1)
    end
  end

  describe "stock management" do
    let(:stock) { create(:stock) }

    describe "adding stocks" do
      it "can add a stock with target price" do
        expect {
          RadarStock.create!(radar: radar, stock: stock, target_price: 150.00)
        }.to change(radar.stocks, :count).by(1)

        expect(radar.stocks).to include(stock)
        expect(radar.radar_stocks.first.target_price).to eq(BigDecimal('150.00'))
      end

      it "can add a stock without target price" do
        expect {
          RadarStock.create!(radar: radar, stock: stock, target_price: nil)
        }.to change(radar.stocks, :count).by(1)

        expect(radar.stocks).to include(stock)
        expect(radar.radar_stocks.first.target_price).to be_nil
      end
    end

    describe "removing stocks" do
      before do
        RadarStock.create!(radar: radar, stock: stock, target_price: 150.00)
      end

      it "can remove a stock" do
        expect {
          radar.radar_stocks.find_by(stock: stock).destroy
        }.to change(radar.stocks, :count).by(-1)

        expect(radar.stocks).not_to include(stock)
      end
    end

    describe "updating target price" do
      let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 150.00) }

      it "can update target price" do
        radar_stock.update!(target_price: 175.00)
        expect(radar_stock.reload.target_price).to eq(BigDecimal('175.00'))
      end

      it "can remove target price" do
        radar_stock.update!(target_price: nil)
        expect(radar_stock.reload.target_price).to be_nil
      end
    end
  end
end
