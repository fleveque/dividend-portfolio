RSpec.describe BuyPlanItem, type: :model do
  let(:user) { create(:user) }
  let(:buy_plan) { create(:buy_plan, user: user) }
  let(:stock) { create(:stock) }

  describe 'associations' do
    it { should belong_to(:buy_plan) }
    it { should belong_to(:stock) }
  end

  describe 'validations' do
    subject { build(:buy_plan_item, buy_plan: buy_plan, stock: stock) }

    it { should validate_presence_of(:quantity) }
    it { should validate_numericality_of(:quantity).only_integer.is_greater_than(0) }
    it { should validate_uniqueness_of(:stock_id).scoped_to(:buy_plan_id) }
  end

  describe 'quantity validations' do
    it 'rejects zero quantity' do
      item = build(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 0)
      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to include('must be greater than 0')
    end

    it 'rejects negative quantity' do
      item = build(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: -5)
      expect(item).not_to be_valid
    end

    it 'rejects non-integer quantity' do
      item = build(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 10.5)
      expect(item).not_to be_valid
    end

    it 'accepts valid quantity' do
      item = build(:buy_plan_item, buy_plan: buy_plan, stock: stock, quantity: 50)
      expect(item).to be_valid
    end
  end

  describe 'stock uniqueness' do
    it 'prevents duplicate stocks in the same buy plan' do
      create(:buy_plan_item, buy_plan: buy_plan, stock: stock)

      duplicate = build(:buy_plan_item, buy_plan: buy_plan, stock: stock)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:stock_id]).to include('has already been taken')
    end

    it 'allows same stock in different buy plans' do
      other_user = create(:user)
      other_plan = create(:buy_plan, user: other_user)

      create(:buy_plan_item, buy_plan: buy_plan, stock: stock)
      item = build(:buy_plan_item, buy_plan: other_plan, stock: stock)

      expect(item).to be_valid
    end
  end
end
