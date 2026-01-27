RSpec.describe Dividend, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:stock) }
  end

  describe "validations" do
    it { should validate_presence_of(:amount) }
    it { should validate_numericality_of(:amount).is_greater_than(0) }
    it { should validate_presence_of(:date) }
  end

  describe "factory" do
    it "has a valid factory" do
      expect(build(:dividend)).to be_valid
    end
  end
end
