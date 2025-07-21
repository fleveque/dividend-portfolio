require 'rails_helper'

RSpec.describe StockDecorator do
  let(:stock) { Stock.new(symbol: 'AAPL', name: 'Apple Inc.', price: 150.00) }
  let(:decorated_stock) { StockDecorator.new(stock) }

  describe '#formatted_price' do
    it 'formats price with dollar sign' do
      expect(decorated_stock.formatted_price).to eq('$150.0')
    end

    it 'returns N/A when price is nil' do
      stock.price = nil
      expect(decorated_stock.formatted_price).to eq('N/A')
    end
  end

  describe '#formatted_target_price' do
    it 'formats target price with dollar sign' do
      # Simulate how target_price gets added via join table
      stock.define_singleton_method(:target_price) { 145.00 }
      expect(decorated_stock.formatted_target_price).to eq('$145.0')
    end

    it 'returns N/A when target price is nil' do
      expect(decorated_stock.formatted_target_price).to eq('N/A')
    end
  end

  describe '#price_status_class' do
    context 'when current price is below target' do
      before do
        stock.define_singleton_method(:current_price) { 140.00 }
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns green gradient class' do
        expect(decorated_stock.price_status_class).to include('border-green-500')
      end
    end

    context 'when current price is above target' do
      before do
        stock.define_singleton_method(:current_price) { 160.00 }
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns red gradient class' do
        expect(decorated_stock.price_status_class).to include('border-red-500')
      end
    end

    context 'when no target price is set' do
      it 'returns gray border class' do
        expect(decorated_stock.price_status_class).to eq('border-gray-500')
      end
    end
  end

  describe '#percentage_difference_from_target' do
    it 'calculates percentage difference correctly' do
      stock.define_singleton_method(:current_price) { 165.00 }
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.percentage_difference_from_target).to eq(10.0)
    end

    it 'returns nil when target price is missing' do
      stock.define_singleton_method(:current_price) { 160.00 }
      expect(decorated_stock.percentage_difference_from_target).to be_nil
    end
  end

  describe '#target_status_methods' do
    before do
      stock.define_singleton_method(:current_price) { 160.00 }
      stock.define_singleton_method(:target_price) { 150.00 }
    end

    it 'correctly identifies when above target' do
      expect(decorated_stock.above_target?).to be true
      expect(decorated_stock.below_target?).to be false
      expect(decorated_stock.at_target?).to be false
    end
  end
end
