require 'rails_helper'

RSpec.describe FxRate, type: :model do
  describe 'validations' do
    subject { build(:fx_rate) }

    it { is_expected.to validate_presence_of(:base) }
    it { is_expected.to validate_presence_of(:quote) }
    it { is_expected.to validate_presence_of(:rate) }
    it { is_expected.to validate_numericality_of(:rate).is_greater_than(0) }

    it 'enforces uniqueness on [base, quote]' do
      create(:fx_rate, base: "EUR", quote: "USD")
      duplicate = build(:fx_rate, base: "EUR", quote: "USD")
      expect(duplicate).not_to be_valid
    end

    it 'allows the same base with different quotes' do
      create(:fx_rate, base: "EUR", quote: "USD")
      expect(build(:fx_rate, base: "EUR", quote: "GBP")).to be_valid
    end
  end

  describe '.fresh' do
    it 'includes rows fetched within STALE_AFTER' do
      fresh = create(:fx_rate, fetched_at: 1.hour.ago)
      _stale = create(:fx_rate, base: "GBP", fetched_at: 2.days.ago)
      expect(described_class.fresh).to contain_exactly(fresh)
    end
  end

  describe '.upsert_rate' do
    it 'inserts a new row when no pair exists' do
      expect { described_class.upsert_rate("EUR", "USD", 1.10) }.to change(described_class, :count).by(1)
    end

    it 'updates the rate and fetched_at when the pair already exists' do
      existing = create(:fx_rate, base: "EUR", quote: "USD", rate: 1.05, fetched_at: 1.day.ago)
      described_class.upsert_rate("EUR", "USD", 1.15)
      existing.reload
      expect(existing.rate.to_f).to eq(1.15)
      expect(existing.fetched_at).to be > 1.minute.ago
    end
  end
end
