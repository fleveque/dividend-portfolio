require "rails_helper"

RSpec.describe AiRateLimiter, type: :service do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }

  describe ".allow?" do
    it "allows the first DAILY_LIMIT calls for a regular user" do
      AiRateLimiter::DAILY_LIMIT.times do
        result = described_class.allow?(user, "radar_insights")
        expect(result).to be_allowed
        described_class.record!(user: user, feature: "radar_insights", provider: :gemini)
      end
    end

    it "blocks the call after the daily limit is reached" do
      AiRateLimiter::DAILY_LIMIT.times do
        described_class.record!(user: user, feature: "radar_insights", provider: :gemini)
      end

      result = described_class.allow?(user, "radar_insights")
      expect(result).not_to be_allowed
      expect(result.remaining).to eq(0)
      expect(result.limit).to eq(AiRateLimiter::DAILY_LIMIT)
      expect(result.reset_at).to be_a(Time)
    end

    it "bypasses the limit for admins regardless of usage" do
      (AiRateLimiter::DAILY_LIMIT * 5).times do
        described_class.record!(user: admin, feature: "radar_insights", provider: :gemini)
      end

      result = described_class.allow?(admin, "radar_insights")
      expect(result).to be_allowed
      expect(result.admin_bypass).to be(true)
    end

    it "only counts requests from the current UTC day" do
      AiRequest.create!(user: user, feature: "radar_insights", provider: "gemini", created_at: 2.days.ago)

      # Yesterday's usage doesn't count toward today's quota.
      AiRateLimiter::DAILY_LIMIT.times do
        result = described_class.allow?(user, "radar_insights")
        expect(result).to be_allowed
        described_class.record!(user: user, feature: "radar_insights", provider: :gemini)
      end
    end

    it "counts across features (the limit is per user, not per feature)" do
      described_class.record!(user: user, feature: "radar_insights", provider: :gemini)
      described_class.record!(user: user, feature: "portfolio_insights", provider: :gemini)
      described_class.record!(user: user, feature: "stock_summary", provider: :gemini)

      result = described_class.allow?(user, "radar_insights")
      expect(result).not_to be_allowed
    end
  end

  describe ".record!" do
    it "creates an AiRequest tagged with the provider name" do
      expect {
        described_class.record!(user: user, feature: "stock_summary", provider: :gemini)
      }.to change(AiRequest, :count).by(1)

      record = AiRequest.last
      expect(record.user).to eq(user)
      expect(record.feature).to eq("stock_summary")
      expect(record.provider).to eq("gemini")
    end
  end
end
