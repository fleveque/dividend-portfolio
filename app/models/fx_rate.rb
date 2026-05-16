class FxRate < ApplicationRecord
  STALE_AFTER = 24.hours

  validates :base, :quote, presence: true
  validates :base, uniqueness: { scope: :quote }
  validates :rate, presence: true, numericality: { greater_than: 0 }

  scope :fresh, -> { where("fetched_at > ?", STALE_AFTER.ago) }

  def self.upsert_rate(base, quote, rate)
    record = find_or_initialize_by(base: base, quote: quote)
    record.update!(rate: rate, fetched_at: Time.current)
    record
  end
end
