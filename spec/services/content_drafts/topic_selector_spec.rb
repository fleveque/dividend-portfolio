require 'rails_helper'

RSpec.describe ContentDrafts::TopicSelector do
  describe '.pick (auto)' do
    let(:stock) { create(:stock, symbol: "AAPL", price: 150.0) }

    before do
      stock # ensure at least one stock is on the books for top_scored
      allow(Stock).to receive(:top_scored).and_return([ stock ])
      allow(ContentDrafts::TopicDataBuilder).to receive_messages(any_upcoming_ex_dividend?: false, pulse_cohort_meets_threshold?: false)
    end

    it 'auto-picks stock_of_the_day when other categories are unavailable' do
      result = described_class.pick

      expect(result[:category]).to eq("stock_of_the_day")
      expect(result[:topic_key]).to eq("AAPL")
    end

    it 'skips stock_of_the_day if its only candidate is on cooldown — falls through to next eligible' do
      create(:content_draft, topic_type: "stock_of_the_day", topic_key: "AAPL", generated_at: 1.day.ago)
      # No other categories available; selector forces a stock_of_the_day with relaxed cooldown
      result = described_class.pick

      expect(result[:category]).to eq("stock_of_the_day")
      expect(result[:topic_key]).to eq("AAPL")
    end

    it 'avoids a category used yesterday' do
      create(:content_draft, topic_type: "stock_of_the_day", topic_key: "AAPL", generated_at: 1.hour.ago)
      # With stock_of_the_day on cooldown and the other categories unavailable, falls back.
      result = described_class.pick
      expect(result[:category]).to eq("stock_of_the_day") # forced fallback
    end
  end

  describe '.pick (explicit)' do
    let(:stock) { create(:stock, symbol: "AAPL", price: 150.0) }

    before do
      stock
      allow(Stock).to receive(:top_scored).and_return([ stock ])
    end

    it 'returns the requested category when topic is available' do
      result = described_class.pick(category: "stock_of_the_day")

      expect(result[:category]).to eq("stock_of_the_day")
      expect(result[:topic_key]).to eq("AAPL")
    end

    it 'raises TopicUnavailable for an unknown category' do
      expect { described_class.pick(category: "made_up") }
        .to raise_error(described_class::TopicUnavailable, /unknown category/)
    end

    it 'raises TopicUnavailable for dividend_calendar with no upcoming ex-dividends' do
      allow(ContentDrafts::TopicDataBuilder).to receive(:any_upcoming_ex_dividend?).and_return(false)

      expect { described_class.pick(category: "dividend_calendar") }
        .to raise_error(described_class::TopicUnavailable, /no available topic/)
    end

    it 'raises TopicUnavailable for pulse_aggregates below the cohort threshold' do
      allow(ContentDrafts::TopicDataBuilder).to receive(:pulse_cohort_meets_threshold?).and_return(false)

      expect { described_class.pick(category: "pulse_aggregates") }
        .to raise_error(described_class::TopicUnavailable, /no available topic/)
    end

    it 'raises TopicUnavailable for feature_announcement with no feature_name' do
      expect { described_class.pick(category: "feature_announcement", extras: {}) }
        .to raise_error(described_class::TopicUnavailable, /feature_name/)
    end

    it 'returns slugified feature_announcement key when name is provided' do
      result = described_class.pick(
        category: "feature_announcement",
        extras: { feature_name: "Multi Currency!" }
      )
      expect(result[:category]).to eq("feature_announcement")
      expect(result[:topic_key]).to eq("multi-currency")
    end

    it 'raises if feature_announcement slug was already used' do
      create(:content_draft, :feature_announcement, topic_key: "multi-currency", generated_at: 1.day.ago)

      expect { described_class.pick(category: "feature_announcement", extras: { feature_name: "Multi Currency!" }) }
        .to raise_error(described_class::TopicUnavailable, /already announced/)
    end
  end
end
