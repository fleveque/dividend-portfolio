RSpec.describe Radar, type: :model do
  describe ".most_added_stocks" do
    it "returns the most added stocks" do
      stock1 = create(:stock)
      stock2 = create(:stock)
      stock3 = create(:stock)
      create(:radar, stocks: [ stock1, stock2 ])
      create(:radar, stocks: [ stock1, stock3 ])

      most_added_stocks = Radar.most_added_stocks(2)

      expect(most_added_stocks).to eq([ stock1, stock3 ])
    end
  end
end
