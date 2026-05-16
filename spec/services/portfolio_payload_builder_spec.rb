require 'rails_helper'

RSpec.describe PortfolioPayloadBuilder do
  describe '.call' do
    let(:user) { create(:user, portfolio_slug: "alice") }
    let(:stock) { create(:stock, symbol: "AAPL", price: 175.50) }

    before { create(:holding, user: user, stock: stock, quantity: 10, average_price: 150.0) }

    it 'returns the v1 payload shape: slug + serialized holdings' do
      expect(described_class.call(user)).to eq(
        slug: "alice",
        holdings: [
          { symbol: "AAPL", quantity: 10.0, avg_price: 150.0, price: 175.50 }
        ]
      )
    end

    it 'coerces missing stock price to 0.0' do
      stock.update_column(:price, nil)
      payload = described_class.call(user)
      expect(payload[:holdings].first[:price]).to eq(0.0)
    end

    it 'serializes every holding for the user' do
      goog = create(:stock, symbol: "GOOG", price: 200.0)
      create(:holding, user: user, stock: goog, quantity: 5, average_price: 180.0)

      symbols = described_class.call(user)[:holdings].map { |h| h[:symbol] }
      expect(symbols).to contain_exactly("AAPL", "GOOG")
    end
  end
end
