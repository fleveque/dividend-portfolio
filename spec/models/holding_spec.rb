RSpec.describe Holding, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:stock) }
  end

  describe 'validations' do
    subject { build(:holding) }

    it { should validate_presence_of(:quantity) }
    it { should validate_numericality_of(:quantity).is_greater_than(0) }
    it { should validate_presence_of(:average_price) }
    it { should validate_numericality_of(:average_price).is_greater_than_or_equal_to(0) }
    it { should validate_uniqueness_of(:stock_id).scoped_to(:user_id) }
  end

  describe 'callbacks' do
    let(:user) { create(:user, portfolio_slug: 'test-slug') }
    let(:stock) { create(:stock) }

    it 'publishes portfolio.updated when user has a slug' do
      expect(NatsPublisher).to receive(:publish).with("portfolio.updated", hash_including(slug: 'test-slug'))

      create(:holding, user: user, stock: stock)
    end

    it 'includes price in the NATS payload' do
      stock.update!(price: 150.0)

      expect(NatsPublisher).to receive(:publish).with(
        "portfolio.updated",
        hash_including(holdings: array_including(hash_including(price: 150.0)))
      )

      create(:holding, user: user, stock: stock)
    end

    it 'does not publish when user has no slug' do
      user_no_slug = create(:user)
      expect(NatsPublisher).not_to receive(:publish)

      create(:holding, user: user_no_slug, stock: stock)
    end
  end
end
