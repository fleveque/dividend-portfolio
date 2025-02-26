RSpec.describe Stock, type: :model do
  describe ".last_added" do
    it "returns the last added stocks" do
      _stock1 = create(:stock)
      stock2 = create(:stock)
      stock3 = create(:stock)

      last_added_stocks = Stock.last_added(2)

      expect(last_added_stocks).to eq([ stock3, stock2 ])
    end
  end
end
