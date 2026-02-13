require 'rails_helper'

RSpec.describe StockDecorator do
  let(:stock) { Stock.new(symbol: 'AAPL', name: 'Apple Inc.', price: 150.00) }
  let(:decorated_stock) { StockDecorator.new(stock) }

  describe '#formatted_price' do
    it 'formats price with dollar sign' do
      expect(decorated_stock.formatted_price).to eq('$150.00')
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
      expect(decorated_stock.formatted_target_price).to eq('$145.00')
    end

    it 'returns N/A when target price is nil' do
      expect(decorated_stock.formatted_target_price).to eq('N/A')
    end
  end

  describe '#current_price' do
    it 'delegates to price method' do
      expect(decorated_stock.current_price).to eq(150.00)
    end
  end

  describe '#display_name' do
    it 'returns formatted symbol and name' do
      expect(decorated_stock.display_name).to eq('AAPL - Apple Inc.')
    end
  end

  describe '#price_status_class' do
    context 'when current price is below target' do
      before do
        stock.price = 140.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns green gradient class' do
        expect(decorated_stock.price_status_class).to include('border-green-500')
        expect(decorated_stock.price_status_class).to include('bg-gradient-to-r from-green-100 to-green-300')
      end
    end

    context 'when current price is above target' do
      before do
        stock.price = 160.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns red gradient class' do
        expect(decorated_stock.price_status_class).to include('border-red-500')
        expect(decorated_stock.price_status_class).to include('bg-gradient-to-r from-red-100 to-red-300')
      end
    end

    context 'when current price equals target' do
      before do
        stock.price = 150.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns black border class' do
        expect(decorated_stock.price_status_class).to eq('border-black')
      end
    end

    context 'when no target price is set' do
      it 'returns gray border class' do
        expect(decorated_stock.price_status_class).to eq('border-gray-500')
      end
    end

    context 'when no current price is set' do
      before do
        stock.price = nil
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'returns gray border class' do
        expect(decorated_stock.price_status_class).to eq('border-gray-500')
      end
    end
  end

  describe '#percentage_difference_from_target' do
    it 'calculates percentage difference correctly when above target' do
      stock.price = 165.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.percentage_difference_from_target).to eq(10.0)
    end

    it 'calculates percentage difference correctly when below target' do
      stock.price = 135.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.percentage_difference_from_target).to eq(10.0)
    end

    it 'returns 0 when at target price' do
      stock.price = 150.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.percentage_difference_from_target).to eq(0.0)
    end

    it 'returns nil when target price is missing' do
      stock.price = 160.00
      expect(decorated_stock.percentage_difference_from_target).to be_nil
    end

    it 'returns nil when current price is missing' do
      stock.price = nil
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.percentage_difference_from_target).to be_nil
    end
  end

  describe '#formatted_percentage_difference' do
    it 'formats percentage with % sign' do
      stock.price = 165.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.formatted_percentage_difference).to eq('10.0%')
    end

    it 'returns nil when no percentage can be calculated' do
      expect(decorated_stock.formatted_percentage_difference).to be_nil
    end
  end

  describe '#target_status_methods' do
    context 'when above target' do
      before do
        stock.price = 160.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'correctly identifies when above target' do
        expect(decorated_stock.above_target?).to be true
        expect(decorated_stock.below_target?).to be false
        expect(decorated_stock.at_target?).to be false
      end
    end

    context 'when below target' do
      before do
        stock.price = 140.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'correctly identifies when below target' do
        expect(decorated_stock.above_target?).to be false
        expect(decorated_stock.below_target?).to be true
        expect(decorated_stock.at_target?).to be false
      end
    end

    context 'when at target' do
      before do
        stock.price = 150.00
        stock.define_singleton_method(:target_price) { 150.00 }
      end

      it 'correctly identifies when at target' do
        expect(decorated_stock.above_target?).to be false
        expect(decorated_stock.below_target?).to be false
        expect(decorated_stock.at_target?).to be true
      end
    end

    context 'when no target is set' do
      it 'returns false for all status methods' do
        expect(decorated_stock.above_target?).to be false
        expect(decorated_stock.below_target?).to be false
        expect(decorated_stock.at_target?).to be false
      end
    end
  end

  describe '#payment_months' do
    context 'when stored months are present' do
      let(:stock) { Stock.new(symbol: 'AAPL', price: 150.00, payment_frequency: 'quarterly', payment_months: [ 2, 5, 8, 11 ]) }

      it 'returns stored months directly' do
        expect(decorated_stock.payment_months).to eq([ 2, 5, 8, 11 ])
      end
    end

    context 'when monthly stock' do
      let(:stock) { Stock.new(symbol: 'O', price: 60.00, payment_frequency: 'monthly', payment_months: (1..12).to_a) }

      it 'returns all 12 months' do
        expect(decorated_stock.payment_months).to eq((1..12).to_a)
      end
    end

    context 'when semi_annual' do
      let(:stock) { Stock.new(symbol: 'TEST', price: 100.00, payment_frequency: 'semi_annual', payment_months: [ 6, 12 ]) }

      it 'returns [6, 12]' do
        expect(decorated_stock.payment_months).to eq([ 6, 12 ])
      end
    end

    context 'when payment_months is nil' do
      it 'returns empty array' do
        expect(decorated_stock.payment_months).to eq([])
      end
    end

    context 'when payment_months is empty array' do
      let(:stock) { Stock.new(symbol: 'TEST', price: 100.00, payment_months: []) }

      it 'returns empty array' do
        expect(decorated_stock.payment_months).to eq([])
      end
    end
  end

  describe '#dividend_per_payment' do
    context 'when $4.00 annual dividend paid quarterly' do
      let(:stock) { Stock.new(symbol: 'AAPL', price: 150.00, payment_frequency: 'quarterly', dividend: 4.00, payment_months: [ 2, 5, 8, 11 ]) }

      it 'returns $1.00 per payment' do
        expect(decorated_stock.dividend_per_payment).to eq(1.0)
      end
    end

    context 'when schedule data is missing' do
      it 'returns nil' do
        expect(decorated_stock.dividend_per_payment).to be_nil
      end
    end
  end

  describe '#formatted_dividend_per_payment' do
    context 'with schedule data' do
      let(:stock) { Stock.new(symbol: 'AAPL', price: 150.00, payment_frequency: 'quarterly', dividend: 4.00, payment_months: [ 2, 5, 8, 11 ]) }

      it 'returns formatted string' do
        expect(decorated_stock.formatted_dividend_per_payment).to eq('$1.00')
      end
    end

    context 'without schedule data' do
      it 'returns N/A' do
        expect(decorated_stock.formatted_dividend_per_payment).to eq('N/A')
      end
    end
  end

  describe '#formatted_payment_frequency' do
    it 'returns titleized frequency' do
      stock.payment_frequency = 'semi_annual'
      expect(decorated_stock.formatted_payment_frequency).to eq('Semi Annual')
    end

    it 'returns N/A when nil' do
      expect(decorated_stock.formatted_payment_frequency).to eq('N/A')
    end
  end

  describe '#formatted_ex_dividend_date' do
    it 'returns formatted date' do
      stock.ex_dividend_date = Date.new(2024, 3, 15)
      expect(decorated_stock.formatted_ex_dividend_date).to eq('Mar 15, 2024')
    end

    it 'returns N/A when nil' do
      expect(decorated_stock.formatted_ex_dividend_date).to eq('N/A')
    end
  end

  describe '#dividend_schedule_available?' do
    it 'returns true when payment_months and frequency are present' do
      stock.payment_months = [ 3, 6, 9, 12 ]
      stock.payment_frequency = 'quarterly'
      expect(decorated_stock.dividend_schedule_available?).to be true
    end

    it 'returns false when payment_months is empty' do
      stock.payment_frequency = 'quarterly'
      stock.payment_months = []
      expect(decorated_stock.dividend_schedule_available?).to be false
    end

    it 'returns false when payment_frequency is nil' do
      stock.payment_months = [ 3, 6, 9, 12 ]
      expect(decorated_stock.dividend_schedule_available?).to be false
    end

    it 'returns false when payment_months is nil' do
      stock.payment_frequency = 'quarterly'
      expect(decorated_stock.dividend_schedule_available?).to be false
    end
  end

  describe '#dividend_score' do
    context 'with all excellent metrics' do
      let(:stock) do
        Stock.new(
          symbol: 'GREAT', name: 'Great Co', price: 90.00,
          dividend_yield: 4.0, payout_ratio: 50.0, pe_ratio: 12.0,
          ma_200: 100.00, dividend: 3.60,
          payment_frequency: 'quarterly', payment_months: [ 3, 6, 9, 12 ]
        )
      end

      it 'returns 10' do
        expect(decorated_stock.dividend_score).to eq(10)
      end

      it 'labels as Strong' do
        expect(decorated_stock.dividend_score_label).to eq('Strong')
      end
    end

    context 'with mixed metrics' do
      let(:stock) do
        Stock.new(
          symbol: 'MIX', name: 'Mix Co', price: 110.00,
          dividend_yield: 2.0, payout_ratio: 70.0, pe_ratio: 20.0,
          ma_200: 100.00, dividend: 2.20,
          payment_frequency: 'quarterly', payment_months: [ 3, 6, 9, 12 ]
        )
      end

      it 'returns a score in 5-7' do
        # yield=1, payout=1, pe=1, ma200=1 (110<=100*1.1), schedule=2 → 6
        expect(decorated_stock.dividend_score).to eq(6)
      end

      it 'labels as Fair' do
        expect(decorated_stock.dividend_score_label).to eq('Fair')
      end
    end

    context 'with poor metrics' do
      let(:stock) do
        Stock.new(
          symbol: 'POOR', name: 'Poor Co', price: 200.00,
          dividend_yield: 0.5, payout_ratio: 90.0, pe_ratio: 30.0,
          ma_200: 100.00, dividend: 1.00,
          payment_frequency: 'annual', payment_months: [ 6 ]
        )
      end

      it 'returns a score in 1-4' do
        # yield=0, payout=0, pe=0, ma200=0, schedule=1 → 1
        expect(decorated_stock.dividend_score).to eq(1)
      end

      it 'labels as Weak' do
        expect(decorated_stock.dividend_score_label).to eq('Weak')
      end
    end

    context 'with no data (all nil)' do
      let(:stock) { Stock.new(symbol: 'EMPTY', name: 'Empty Co', price: nil) }

      it 'returns score 0' do
        expect(decorated_stock.dividend_score).to eq(0)
      end

      it 'returns nil label (badge hidden)' do
        expect(decorated_stock.dividend_score_label).to be_nil
      end
    end

    context 'with partial data (only yield + payout)' do
      let(:stock) do
        Stock.new(
          symbol: 'PART', name: 'Partial Co', price: nil,
          dividend_yield: 3.5, payout_ratio: 55.0
        )
      end

      it 'still computes a score' do
        # yield=2, payout=2, rest=0 → 4
        expect(decorated_stock.dividend_score).to eq(4)
      end

      it 'returns a label since 2 dimensions have data' do
        expect(decorated_stock.dividend_score_label).to eq('Weak')
      end
    end

    context 'with only one dimension having data' do
      let(:stock) do
        Stock.new(
          symbol: 'ONE', name: 'One Co', price: nil,
          dividend_yield: 5.0
        )
      end

      it 'returns nil label (insufficient data)' do
        expect(decorated_stock.dividend_score_label).to be_nil
      end
    end
  end

  describe '#formatted_fifty_two_week_high' do
    it 'formats with dollar sign' do
      stock.fifty_two_week_high = 200.00
      expect(decorated_stock.formatted_fifty_two_week_high).to eq('$200.00')
    end

    it 'returns N/A when nil' do
      expect(decorated_stock.formatted_fifty_two_week_high).to eq('N/A')
    end
  end

  describe '#formatted_fifty_two_week_low' do
    it 'formats with dollar sign' do
      stock.fifty_two_week_low = 80.00
      expect(decorated_stock.formatted_fifty_two_week_low).to eq('$80.00')
    end

    it 'returns N/A when nil' do
      expect(decorated_stock.formatted_fifty_two_week_low).to eq('N/A')
    end
  end

  describe '#fifty_two_week_range_position' do
    context 'when price is at midpoint' do
      before do
        stock.price = 140.00
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
      end

      it 'returns 50.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(50.0)
      end
    end

    context 'when price is at the low' do
      before do
        stock.price = 80.00
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
      end

      it 'returns 0.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(0.0)
      end
    end

    context 'when price is at the high' do
      before do
        stock.price = 200.00
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
      end

      it 'returns 100.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(100.0)
      end
    end

    context 'when high equals low (zero range)' do
      before do
        stock.price = 100.00
        stock.fifty_two_week_high = 100.00
        stock.fifty_two_week_low = 100.00
      end

      it 'returns 50.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(50.0)
      end
    end

    context 'when price exceeds high (stale data)' do
      before do
        stock.price = 220.00
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
      end

      it 'clamps to 100.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(100.0)
      end
    end

    context 'when price is below low (stale data)' do
      before do
        stock.price = 60.00
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
      end

      it 'clamps to 0.0' do
        expect(decorated_stock.fifty_two_week_range_position).to eq(0.0)
      end
    end

    context 'when data is missing' do
      it 'returns nil when high is nil' do
        stock.fifty_two_week_low = 80.00
        expect(decorated_stock.fifty_two_week_range_position).to be_nil
      end

      it 'returns nil when low is nil' do
        stock.fifty_two_week_high = 200.00
        expect(decorated_stock.fifty_two_week_range_position).to be_nil
      end

      it 'returns nil when price is nil' do
        stock.price = nil
        stock.fifty_two_week_high = 200.00
        stock.fifty_two_week_low = 80.00
        expect(decorated_stock.fifty_two_week_range_position).to be_nil
      end
    end
  end

  describe '#fifty_two_week_data_available?' do
    it 'returns true when both high and low are present' do
      stock.fifty_two_week_high = 200.00
      stock.fifty_two_week_low = 80.00
      expect(decorated_stock.fifty_two_week_data_available?).to be true
    end

    it 'returns false when high is nil' do
      stock.fifty_two_week_low = 80.00
      expect(decorated_stock.fifty_two_week_data_available?).to be false
    end

    it 'returns false when low is nil' do
      stock.fifty_two_week_high = 200.00
      expect(decorated_stock.fifty_two_week_data_available?).to be false
    end

    it 'returns false when both are nil' do
      expect(decorated_stock.fifty_two_week_data_available?).to be false
    end
  end

  describe '#target_status_text' do
    it 'returns appropriate text for below target' do
      stock.price = 140.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.target_status_text).to eq('Below target')
    end

    it 'returns appropriate text for above target' do
      stock.price = 160.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.target_status_text).to eq('Above target')
    end

    it 'returns appropriate text for at target' do
      stock.price = 150.00
      stock.define_singleton_method(:target_price) { 150.00 }
      expect(decorated_stock.target_status_text).to eq('At target')
    end

    it 'returns appropriate text when no target is set' do
      expect(decorated_stock.target_status_text).to eq('No target set')
    end
  end
end
