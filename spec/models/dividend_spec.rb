RSpec.describe Dividend, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:stock) }
  end

  describe "validations" do
    it { should validate_presence_of(:amount) }
    it { should validate_numericality_of(:amount).is_greater_than(0) }
    it { should validate_presence_of(:date) }
    it { should validate_presence_of(:currency) }
    it { should validate_presence_of(:source) }
    it { should validate_inclusion_of(:source).in_array(Dividend::SOURCES) }
    it { should validate_numericality_of(:withholding_tax).is_greater_than_or_equal_to(0) }
  end

  describe "factory" do
    it "has a valid factory" do
      expect(build(:dividend)).to be_valid
    end

    it "has a valid :ibkr trait" do
      expect(build(:dividend, :ibkr)).to be_valid
    end
  end

  describe "#net" do
    it "returns amount minus withholding_tax" do
      d = build(:dividend, amount: 10.0, withholding_tax: 1.5)
      expect(d.net).to eq(8.5)
    end
  end

  describe "scopes" do
    it ".manual returns only manual rows" do
      manual = create(:dividend, source: "manual")
      _imported = create(:dividend, :ibkr)
      expect(Dividend.manual).to contain_exactly(manual)
    end

    it ".imported returns non-manual rows" do
      _manual = create(:dividend, source: "manual")
      imported = create(:dividend, :ibkr)
      expect(Dividend.imported).to contain_exactly(imported)
    end
  end
end
