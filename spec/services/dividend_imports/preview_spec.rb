require "rails_helper"

RSpec.describe DividendImports::Preview do
  let(:user) { create(:user) }
  let(:row) do
    {
      ticker: "NKE", isin: "US6541061031", currency: "USD",
      date: Date.new(2025, 1, 2), per_share_amount: BigDecimal("0.40"),
      amount: BigDecimal("2.8"), quantity: 7, withholding_tax: BigDecimal("0.42")
    }
  end

  let(:parsed) { { language: :es, dividends: [ row ], skipped: [] } }

  describe ".call" do
    context "when a Stock exists with matching ISIN" do
      let!(:stock) { create(:stock, symbol: "NKE", isin: "US6541061031") }

      it "resolves via ISIN" do
        result = described_class.call(parsed: parsed, user: user)
        expect(result[:resolved].first).to include(stock_id: stock.id)
        expect(result[:unmatched]).to be_empty
      end
    end

    context "when a Stock exists with matching symbol but no ISIN" do
      let!(:stock) { create(:stock, symbol: "NKE", isin: nil) }

      it "resolves via symbol and lazy-backfills the ISIN" do
        result = described_class.call(parsed: parsed, user: user)
        expect(result[:resolved].first).to include(stock_id: stock.id)
        expect(stock.reload.isin).to eq("US6541061031")
      end
    end

    context "when no Stock exists and the provider succeeds" do
      let!(:stock) { create(:stock, symbol: "NKE") }
      let(:provider_class) { instance_double(Class) }
      let(:provider) { instance_double("provider", get_stock: stock) }

      before do
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(provider_class)
        allow(provider_class).to receive(:new).and_return(provider)
        # Force fall-through to provider lookup: remove the by-symbol match by
        # making the resolver look for a ticker the existing stock doesn't have.
        row[:ticker] = "NEW"
        row[:isin] = "US0000000000"
      end

      it "resolves via the provider" do
        result = described_class.call(parsed: parsed, user: user)
        expect(result[:resolved].first[:stock_id]).to eq(stock.id)
      end
    end

    context "when nothing matches" do
      before do
        provider_class = double("provider_class")
        provider = double("provider")
        allow(Rails.application.config).to receive(:financial_data_provider).and_return(provider_class)
        allow(provider_class).to receive(:new).and_return(provider)
        allow(provider).to receive(:get_stock).and_raise(StandardError, "delisted")
      end

      it "puts the row in unmatched" do
        result = described_class.call(parsed: parsed, user: user)
        expect(result[:resolved]).to be_empty
        expect(result[:unmatched].first).to include(ticker: "NKE", reason: "no_match")
      end
    end
  end
end
