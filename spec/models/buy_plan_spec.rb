RSpec.describe BuyPlan, type: :model do
  let(:user) { create(:user) }
  let(:buy_plan) { create(:buy_plan, user: user) }

  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:buy_plan_items).dependent(:destroy) }
    it { should have_many(:stocks).through(:buy_plan_items) }
  end

  describe 'user uniqueness' do
    it 'allows only one buy plan per user' do
      create(:buy_plan, user: user)

      expect {
        create(:buy_plan, user: user)
      }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe 'stock management' do
    let(:stock) { create(:stock) }

    it 'can add a stock with quantity' do
      expect {
        BuyPlanItem.create!(buy_plan: buy_plan, stock: stock, quantity: 10)
      }.to change(buy_plan.stocks, :count).by(1)

      expect(buy_plan.stocks).to include(stock)
      expect(buy_plan.buy_plan_items.first.quantity).to eq(10)
    end

    it 'destroys buy_plan_items when destroyed' do
      BuyPlanItem.create!(buy_plan: buy_plan, stock: stock, quantity: 10)

      expect {
        buy_plan.destroy
      }.to change(BuyPlanItem, :count).by(-1)
    end
  end
end
