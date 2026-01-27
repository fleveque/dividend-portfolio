RSpec.describe StockRadarService, type: :service do
  let(:user) { create(:user) }
  let(:radar) { create(:radar, user: user) }
  let(:stock) { create(:stock) }
  let(:service) { described_class.new(radar) }

  describe '#update_target_price' do
    context 'when stock is on radar' do
      let!(:radar_stock) { create(:radar_stock, radar: radar, stock: stock, target_price: 100.00) }

      it 'updates target price successfully' do
        result = service.update_target_price(stock, '150.00')

        expect(result.success?).to be true
        expect(result.data).to eq(radar_stock)
        expect(radar_stock.reload.target_price).to eq(150.00)
      end

      it 'clears target price when given blank value' do
        result = service.update_target_price(stock, '')

        expect(result.success?).to be true
        expect(radar_stock.reload.target_price).to be_nil
      end

      it 'clears target price when given nil' do
        result = service.update_target_price(stock, nil)

        expect(result.success?).to be true
        expect(radar_stock.reload.target_price).to be_nil
      end
    end

    context 'when stock is not on radar' do
      it 'returns failure' do
        result = service.update_target_price(stock, '150.00')

        expect(result.success?).to be false
        expect(result.error).to eq('Stock not found on radar')
      end
    end
  end

  describe '#add_stock' do
    context 'when stock is not on radar' do
      it 'adds stock successfully' do
        result = service.add_stock(stock)

        expect(result.success?).to be true
        expect(result.data).to be_a(RadarStock)
        expect(radar.stocks).to include(stock)
      end

      it 'adds stock with target price' do
        result = service.add_stock(stock, target_price: '150.00')

        expect(result.success?).to be true
        expect(result.data.target_price).to eq(150.00)
      end

      it 'ignores blank target price' do
        result = service.add_stock(stock, target_price: '')

        expect(result.success?).to be true
        expect(result.data.target_price).to be_nil
      end
    end

    context 'when stock is already on radar' do
      before { create(:radar_stock, radar: radar, stock: stock) }

      it 'returns failure' do
        result = service.add_stock(stock)

        expect(result.success?).to be false
        expect(result.error).to eq('Stock already on radar')
      end
    end
  end

  describe '#remove_stock' do
    context 'when stock is on radar' do
      before { create(:radar_stock, radar: radar, stock: stock) }

      it 'removes stock successfully' do
        result = service.remove_stock(stock)

        expect(result.success?).to be true
        expect(radar.stocks).not_to include(stock)
      end
    end

    context 'when stock is not on radar' do
      it 'still returns success' do
        result = service.remove_stock(stock)

        expect(result.success?).to be true
      end
    end
  end
end
