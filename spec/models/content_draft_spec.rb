require 'rails_helper'

RSpec.describe ContentDraft, type: :model do
  describe 'validations' do
    subject { build(:content_draft) }

    it { is_expected.to validate_presence_of(:topic_type) }
    it { is_expected.to validate_inclusion_of(:topic_type).in_array(ContentDraft::TOPIC_TYPES) }
    it { is_expected.to validate_presence_of(:topic_key) }
    it { is_expected.to validate_presence_of(:payload) }
    it { is_expected.to validate_presence_of(:generated_at) }
  end

  describe '.recent' do
    it 'returns drafts ordered by generated_at desc with default limit' do
      old   = create(:content_draft, generated_at: 3.days.ago)
      newer = create(:content_draft, generated_at: 1.day.ago)
      expect(described_class.recent.pluck(:id)).to eq([ newer.id, old.id ])
    end

    it 'honors a custom limit' do
      3.times.map { |i| create(:content_draft, generated_at: i.hours.ago) }
      expect(described_class.recent(2).count).to eq(2)
    end
  end

  describe '.recent_keys' do
    it 'returns a Set of topic_keys for the requested type within the window' do
      create(:content_draft, topic_key: "AAPL", generated_at: 1.day.ago)
      create(:content_draft, topic_key: "MSFT", generated_at: 7.days.ago)
      create(:content_draft, topic_key: "GOOG", generated_at: 60.days.ago)

      result = described_class.recent_keys("stock_of_the_day", days: 14)
      expect(result).to be_a(Set)
      expect(result).to contain_exactly("AAPL", "MSFT")
    end

    it 'scopes by topic_type — does not leak keys across categories' do
      create(:content_draft, topic_type: "stock_of_the_day", topic_key: "AAPL", generated_at: 1.day.ago)
      create(:content_draft, :dividend_calendar, topic_key: "2026-W21", generated_at: 1.day.ago)

      expect(described_class.recent_keys("stock_of_the_day", days: 7)).to eq(Set["AAPL"])
      expect(described_class.recent_keys("dividend_calendar", days: 7)).to eq(Set["2026-W21"])
    end
  end

  describe '.recent_topic_types' do
    it 'returns categories used in the window, most recent first, uniq' do
      create(:content_draft, topic_type: "stock_of_the_day", generated_at: 1.hour.ago)
      create(:content_draft, :dividend_calendar, generated_at: 2.hours.ago)
      create(:content_draft, topic_type: "stock_of_the_day", generated_at: 3.hours.ago)
      create(:content_draft, :pulse_aggregates, generated_at: 8.days.ago)

      result = described_class.recent_topic_types(days: 1)
      expect(result).to eq(%w[stock_of_the_day dividend_calendar])
    end
  end
end
