RSpec.describe Transaction, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:stock) }
  end

  describe "validations" do
    it { should validate_presence_of(:transaction_type) }
    it { should validate_presence_of(:quantity) }
    it { should validate_numericality_of(:quantity).only_integer.is_greater_than(0) }
    it { should validate_presence_of(:price) }
    it { should validate_numericality_of(:price).is_greater_than(0) }
  end

  describe "enums" do
    it { should define_enum_for(:transaction_type).backed_by_column_of_type(:string).with_values(buy: "buy", sell: "sell") }
  end

  describe "factory" do
    it "has a valid factory" do
      expect(build(:transaction)).to be_valid
    end
  end
end
