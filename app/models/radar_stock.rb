class RadarStock < ApplicationRecord
  self.primary_key = [ :radar_id, :stock_id ]

  belongs_to :radar
  belongs_to :stock

  validates :radar, presence: true
  validates :stock, presence: true
  validates :stock_id, uniqueness: { scope: :radar_id }
  validates :target_price, numericality: { greater_than: 0 }, allow_nil: true

  scope :with_target_price, -> { where.not(target_price: nil) }
  scope :without_target_price, -> { where(target_price: nil) }

  # Mirror Holding#publish_portfolio_updated: any change to a radar entry
  # (add, remove, target_price tweak) re-publishes the full radar to Pulse
  # so the public page stays in sync. Only fires when the user is actually
  # sharing their radar.
  after_commit :publish_radar_updated

  private

  def publish_radar_updated
    user = radar&.user
    return unless user&.portfolio_slug.present? && user.share_radar?

    NatsPublisher.publish("radar.updated", RadarPayloadBuilder.call(user))
  end
end
