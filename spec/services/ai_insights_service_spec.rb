RSpec.describe AiInsightsService, type: :service do
  let(:stocks_data) do
    [
      { symbol: "AAPL", price: 150.0, dividendYield: 0.6, payoutRatio: 15.0 },
      { symbol: "KO", price: 55.0, dividendYield: 3.2, payoutRatio: 70.0 }
    ]
  end

  let(:stock_data) do
    { id: 1, symbol: "AAPL", price: 150.0, dividendYield: 0.6, updated_at: 1234567890 }
  end

  let(:radar_insights_result) do
    {
      summary: "Portfolio has 2 stocks",
      buyingOpportunities: [],
      coverageGaps: "Months 1-12 have no coverage",
      riskFlags: [],
      strengths: [ "Diversified holdings" ]
    }
  end

  let(:stock_summary_result) do
    {
      summary: "AAPL is a solid hold",
      verdict: "hold",
      keyPoints: [ "Low yield", "Strong growth" ]
    }
  end

  after do
    described_class.instance_variable_set(:@provider, nil)
  end

  describe ".radar_insights" do
    it "delegates to the provider" do
      provider = instance_double(AiProviders::GeminiProvider, radar_insights: radar_insights_result)
      allow(AiProviders::GeminiProvider).to receive(:new).and_return(provider)

      result = described_class.radar_insights(stocks_data)

      expect(result).to eq(radar_insights_result)
      expect(provider).to have_received(:radar_insights).with(stocks_data)
    end
  end

  describe ".stock_summary" do
    it "delegates to the provider" do
      provider = instance_double(AiProviders::GeminiProvider, stock_summary: stock_summary_result)
      allow(AiProviders::GeminiProvider).to receive(:new).and_return(provider)

      result = described_class.stock_summary(stock_data)

      expect(result).to eq(stock_summary_result)
      expect(provider).to have_received(:stock_summary).with(stock_data)
    end
  end
end
