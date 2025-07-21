require 'rails_helper'

RSpec.describe RadarStock, type: :model do
  let(:user) { create(:user) }
  let(:radar) { create(:radar, user: user) }
  let(:stock) { create(:stock) }

  subject { RadarStock.new(radar: radar, stock: stock, target_price: 100.00) }

  describe 'associations' do
    it { should belong_to(:radar) }
    it { should belong_to(:stock) }
  end

  describe 'validations' do
    it { should validate_presence_of(:radar) }
    it { should validate_presence_of(:stock) }
    it { should validate_uniqueness_of(:stock_id).scoped_to(:radar_id) }

    context 'target_price validation' do
      let(:radar_stock) { RadarStock.new(radar: radar, stock: stock, target_price: 100.00) }

      it 'allows nil target_price' do
        radar_stock.target_price = nil
        expect(radar_stock).to be_valid
      end

      it 'allows positive target_price' do
        radar_stock.target_price = 150.50
        expect(radar_stock).to be_valid
      end

      it 'does not allow negative target_price' do
        radar_stock.target_price = -10.00
        expect(radar_stock).not_to be_valid
        expect(radar_stock.errors[:target_price]).to include('must be greater than 0')
      end

      it 'does not allow zero target_price' do
        radar_stock.target_price = 0.00
        expect(radar_stock).not_to be_valid
        expect(radar_stock.errors[:target_price]).to include('must be greater than 0')
      end
    end

    it 'prevents duplicate radar-stock combinations' do
      RadarStock.create!(radar: radar, stock: stock, target_price: 100.00)
      duplicate_radar_stock = RadarStock.new(radar: radar, stock: stock, target_price: 120.00)

      expect(duplicate_radar_stock).not_to be_valid
      expect(duplicate_radar_stock.errors[:stock_id]).to include('has already been taken')
    end
  end

  describe 'database constraints' do
    let(:radar_stock) { RadarStock.new(radar: radar, stock: stock, target_price: 100.00) }

    it 'saves successfully with all required fields' do
      expect { radar_stock.save! }.not_to raise_error
    end

    it 'persists target_price as decimal' do
      radar_stock.target_price = 123.45
      radar_stock.save!

      reloaded = RadarStock.find_by(radar: radar, stock: stock)
      expect(reloaded.target_price).to eq(BigDecimal('123.45'))
    end
  end

  describe 'scopes' do
    let!(:radar_stock1) { RadarStock.create!(radar: radar, stock: stock, target_price: 100.00) }
    let!(:radar_stock2) { RadarStock.create!(radar: radar, stock: create(:stock), target_price: nil) }
    let!(:radar_stock3) { RadarStock.create!(radar: radar, stock: create(:stock), target_price: 150.00) }

    describe '.with_target_price' do
      it 'returns only radar_stocks with target_price set' do
        results = RadarStock.with_target_price
        expect(results).to include(radar_stock1, radar_stock3)
        expect(results).not_to include(radar_stock2)
      end
    end

    describe '.without_target_price' do
      it 'returns only radar_stocks without target_price' do
        results = RadarStock.without_target_price
        expect(results).to include(radar_stock2)
        expect(results).not_to include(radar_stock1, radar_stock3)
      end
    end
  end
end
