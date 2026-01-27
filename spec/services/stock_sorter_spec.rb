require 'ostruct'

RSpec.describe StockSorter, type: :service do
  describe '#sort' do
    def build_stock(price:, target_price:)
      OpenStruct.new(price: price, target_price: target_price)
    end

    context 'with stocks below target' do
      it 'sorts furthest below first (best deals first)' do
        stock_5_below = build_stock(price: 95, target_price: 100)   # 5% below
        stock_10_below = build_stock(price: 90, target_price: 100)  # 10% below

        stocks = [ stock_5_below, stock_10_below ]
        sorted = described_class.new(stocks).sort

        expect(sorted).to eq([ stock_10_below, stock_5_below ])
      end
    end

    context 'with stocks above target' do
      it 'sorts closest to target first among above-target stocks' do
        stock_5_above = build_stock(price: 105, target_price: 100)   # 5% above
        stock_10_above = build_stock(price: 110, target_price: 100)  # 10% above

        stocks = [ stock_10_above, stock_5_above ]
        sorted = described_class.new(stocks).sort

        expect(sorted).to eq([ stock_5_above, stock_10_above ])
      end
    end

    context 'with mixed stocks' do
      it 'prioritizes below-target stocks over above-target stocks' do
        below_target = build_stock(price: 90, target_price: 100)  # 10% below
        above_target = build_stock(price: 105, target_price: 100) # 5% above

        stocks = [ above_target, below_target ]
        sorted = described_class.new(stocks).sort

        expect(sorted).to eq([ below_target, above_target ])
      end
    end

    context 'with stocks without target price' do
      it 'places them between below-target and above-target stocks' do
        below_target = build_stock(price: 90, target_price: 100)
        no_target = build_stock(price: 100, target_price: nil)
        above_target = build_stock(price: 150, target_price: 100)

        stocks = [ above_target, no_target, below_target ]
        sorted = described_class.new(stocks).sort

        expect(sorted.first).to eq(below_target)
        expect(sorted[1]).to eq(no_target)
        expect(sorted.last).to eq(above_target)
      end
    end

    context 'with empty collection' do
      it 'returns empty array' do
        sorted = described_class.new([]).sort
        expect(sorted).to eq([])
      end
    end
  end
end
