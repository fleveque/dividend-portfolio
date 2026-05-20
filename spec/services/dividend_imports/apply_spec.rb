require "rails_helper"

RSpec.describe DividendImports::Apply do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: "NKE", isin: "US6541061031") }
  let(:row) do
    {
      ticker: "NKE", stock_id: stock.id, currency: "USD",
      date: Date.new(2025, 1, 2), per_share_amount: BigDecimal("0.40"),
      amount: BigDecimal("2.8"), quantity: 7, withholding_tax: BigDecimal("0.42")
    }
  end

  describe ".call" do
    it "creates new Dividend rows with source='ibkr'" do
      result = described_class.call(user: user, rows: [ row ])

      expect(result).to eq(created: 1, updated: 0, skipped: 0)
      div = Dividend.last
      expect(div).to have_attributes(
        user_id: user.id, stock_id: stock.id, source: "ibkr",
        amount: 2.8, withholding_tax: 0.42, quantity: 7, currency: "USD"
      )
    end

    it "is idempotent — re-importing the same row updates rather than duplicates" do
      described_class.call(user: user, rows: [ row ])
      expect {
        described_class.call(user: user, rows: [ row.merge(amount: BigDecimal("3.5")) ])
      }.not_to change(Dividend, :count)

      expect(Dividend.last.amount).to eq(3.5)
    end

    it "does not touch manual rows that share the natural key" do
      manual = create(:dividend, user: user, stock: stock, date: row[:date],
                       per_share_amount: row[:per_share_amount], source: "manual",
                       amount: 99, withholding_tax: 5)

      described_class.call(user: user, rows: [ row ])

      manual.reload
      expect(manual.amount).to eq(99)
      expect(manual.withholding_tax).to eq(5)
      expect(Dividend.where(stock: stock, date: row[:date]).count).to eq(2) # manual + ibkr
    end

    it "uses manual_mapping to resolve rows that arrived without a stock_id" do
      row[:stock_id] = nil
      result = described_class.call(user: user, rows: [ row ], manual_mapping: { "NKE" => stock.id })
      expect(result[:created]).to eq(1)
    end

    it "skips rows that still have no stock_id after manual_mapping" do
      row[:stock_id] = nil
      result = described_class.call(user: user, rows: [ row ])
      expect(result).to eq(created: 0, updated: 0, skipped: 1)
    end

    describe "source: parameter" do
      it "persists rows with the supplied source key" do
        described_class.call(user: user, rows: [ row ], source: "myinvestor")
        expect(Dividend.last.source).to eq("myinvestor")
      end

      it "defaults to 'ibkr' when source is not provided" do
        described_class.call(user: user, rows: [ row ])
        expect(Dividend.last.source).to eq("ibkr")
      end

      it "does not collide with a same-natural-key row from a different source" do
        # Same (user, stock, date, per_share) but different source → both rows survive.
        described_class.call(user: user, rows: [ row ], source: "ibkr")
        described_class.call(user: user, rows: [ row ], source: "myinvestor")
        expect(Dividend.where(stock: stock, date: row[:date]).pluck(:source)).to contain_exactly("ibkr", "myinvestor")
      end
    end
  end
end
