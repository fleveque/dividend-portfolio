RSpec.describe Stock, type: :model do
  subject { Stock.new(symbol: 'AAPL', name: 'Apple Inc.') }

  describe 'associations' do
    it { should have_many(:radar_stocks).dependent(:destroy) }
    it { should have_many(:radars).through(:radar_stocks) }
    it { should have_many(:transactions) }
    it { should have_many(:dividends) }
  end

  describe 'validations' do
    it { should validate_presence_of(:symbol) }
    it { should validate_uniqueness_of(:symbol) }

    describe 'payment_frequency' do
      it { should allow_value(nil).for(:payment_frequency) }
      it { should allow_value('monthly').for(:payment_frequency) }
      it { should allow_value('quarterly').for(:payment_frequency) }
      it { should allow_value('semi_annual').for(:payment_frequency) }
      it { should allow_value('annual').for(:payment_frequency) }
      it { should_not allow_value('weekly').for(:payment_frequency) }
      it { should_not allow_value('bimonthly').for(:payment_frequency) }
    end
  end

  describe ".last_added" do
    it "returns the last added stocks" do
      _stock1 = create(:stock)
      stock2 = create(:stock)
      stock3 = create(:stock)

      last_added_stocks = Stock.last_added(2)

      expect(last_added_stocks).to eq([ stock3, stock2 ])
    end
  end

  describe 'radar associations' do
    let(:stock) { create(:stock) }
    let(:radar1) { create(:radar) }
    let(:radar2) { create(:radar) }

    it 'can be added to multiple radars' do
      RadarStock.create!(radar: radar1, stock: stock, target_price: 100.00)
      RadarStock.create!(radar: radar2, stock: stock, target_price: 150.00)

      expect(stock.radars).to include(radar1, radar2)
      expect(stock.radar_stocks.count).to eq(2)
    end

    it 'maintains target price per radar' do
      radar_stock1 = RadarStock.create!(radar: radar1, stock: stock, target_price: 100.00)
      radar_stock2 = RadarStock.create!(radar: radar2, stock: stock, target_price: 150.00)

      expect(radar_stock1.target_price).to eq(BigDecimal('100.00'))
      expect(radar_stock2.target_price).to eq(BigDecimal('150.00'))
    end
  end

  describe 'decorated methods' do
    let(:stock) { create(:stock, symbol: 'AAPL', name: 'Apple Inc.', price: 150.00) }

    it 'can be decorated with StockDecorator' do
      decorated_stock = StockDecorator.new(stock)
      expect(decorated_stock.display_name).to eq('AAPL - Apple Inc.')
      expect(decorated_stock.formatted_price).to eq('$150.00')
    end
  end
end
