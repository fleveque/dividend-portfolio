require "rails_helper"

RSpec.describe AiInsightsService, type: :service do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }

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

  let(:provider) do
    instance_double(
      AiProviders::GeminiProvider,
      name: :gemini,
      radar_insights: radar_insights_result,
      portfolio_insights: radar_insights_result,
      stock_summary: stock_summary_result
    )
  end

  before do
    allow(AiProviders).to receive(:current).and_return(provider)
    Rails.cache.clear
  end

  describe ".radar_insights" do
    it "delegates to the provider on a cold cache" do
      result = described_class.radar_insights(stocks_data, user: user)
      expect(result).to eq(radar_insights_result)
      expect(provider).to have_received(:radar_insights).once
    end

    it "logs an AiRequest after a successful LLM call" do
      expect {
        described_class.radar_insights(stocks_data, user: user)
      }.to change { AiRequest.where(user: user, feature: "radar_insights").count }.by(1)
    end

    it "serves identical inputs from cache (no second LLM call, no second AiRequest)" do
      described_class.radar_insights(stocks_data, user: user)
      expect {
        described_class.radar_insights(stocks_data, user: user)
      }.not_to change(AiRequest, :count)
      expect(provider).to have_received(:radar_insights).once
    end

    it "returns a rate-limited payload when the user is over quota" do
      AiRateLimiter::DAILY_LIMIT.times { AiRateLimiter.record!(user: user, feature: "radar_insights", provider: :gemini) }

      result = described_class.radar_insights(stocks_data, user: user)

      expect(result[:rateLimited]).to be(true)
      expect(result[:feature]).to eq("radar_insights")
      expect(result[:limit]).to eq(AiRateLimiter::DAILY_LIMIT)
      expect(provider).not_to have_received(:radar_insights)
    end

    it "serves cached data even when the user is over quota" do
      described_class.radar_insights(stocks_data, user: admin) # warm the cache via admin call
      AiRateLimiter::DAILY_LIMIT.times { AiRateLimiter.record!(user: user, feature: "radar_insights", provider: :gemini) }

      result = described_class.radar_insights(stocks_data, user: user)
      expect(result).to eq(radar_insights_result) # not rate-limited
    end
  end

  describe ".stock_summary" do
    it "delegates and logs" do
      result = described_class.stock_summary(stock_data, user: user)
      expect(result).to eq(stock_summary_result)
      expect(AiRequest.where(user: user, feature: "stock_summary").count).to eq(1)
    end
  end

  describe ".portfolio_insights" do
    it "delegates and logs" do
      described_class.portfolio_insights(stocks_data, user: user)
      expect(AiRequest.where(user: user, feature: "portfolio_insights").count).to eq(1)
    end
  end
end
