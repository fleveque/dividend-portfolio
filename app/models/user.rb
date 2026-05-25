class User < ApplicationRecord
  has_secure_password validations: false
  has_many :sessions, dependent: :destroy
  has_many :dividends, dependent: :delete_all
  has_one :radar, dependent: :destroy
  has_one :buy_plan, dependent: :destroy
  has_many :holdings, dependent: :delete_all

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  validates :email_address, presence: true, uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, on: :create, unless: :oauth_user?
  validates :portfolio_slug, uniqueness: true, allow_nil: true,
    format: { with: /\A[a-z0-9][a-z0-9-]{1,38}[a-z0-9]\z/, message: "must be 3-40 lowercase alphanumeric characters or hyphens" },
    if: -> { portfolio_slug.present? }
  validates :preferred_currency, presence: true, inclusion: { in: Stock::CURRENCY_SYMBOLS.keys }

  after_commit :publish_pulse_changes,
               if: -> { saved_change_to_portfolio_slug? || saved_change_to_share_portfolio? || saved_change_to_share_radar? }

  # Find or create a user from OAuth provider data
  def self.from_omniauth(auth)
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.email_address = auth.info.email
      user.name = auth.info.name
    end
  end

  def oauth_user?
    provider.present?
  end

  private

  # On any save that touches portfolio_slug / share_portfolio / share_radar,
  # diff the before/after state for each Pulse surface (portfolio + radar)
  # and emit the right opted_in / opted_out events. `updated` events are
  # owned by Holding / RadarStock callbacks — this method handles the
  # opt-state lifecycle only.
  def publish_pulse_changes
    publish_surface_change(:portfolio, share_portfolio?)
    publish_surface_change(:radar, share_radar?)
  end

  # Emits `<surface>.opted_in` / `<surface>.opted_out` based on the
  # *effective shared state* (slug present AND surface toggle on) before
  # and after the save. Slug changes and toggle changes are both handled
  # here, so a user clearing their slug fires opt-outs for any currently
  # active surface.
  def publish_surface_change(surface, currently_enabled_flag)
    was_shared = previously_shared?(surface)
    is_shared = portfolio_slug.present? && currently_enabled_flag

    if is_shared && !was_shared
      NatsPublisher.publish("#{surface}.opted_in", payload_for(surface))
    elsif was_shared && !is_shared
      slug_for_out = saved_change_to_portfolio_slug? ? saved_change_to_portfolio_slug.first : portfolio_slug
      NatsPublisher.publish("#{surface}.opted_out", { slug: slug_for_out }) if slug_for_out.present?
    end
  end

  # Reconstruct the *previous* effective sharing state for `surface` by
  # looking at saved_change_to_* on the slug and the relevant toggle.
  # If a column wasn't part of this save its current value is also its
  # "previous" value.
  def previously_shared?(surface)
    prev_slug = saved_change_to_portfolio_slug? ? saved_change_to_portfolio_slug.first : portfolio_slug
    toggle_change = saved_change_to_share_portfolio if surface == :portfolio
    toggle_change ||= saved_change_to_share_radar if surface == :radar
    prev_flag = toggle_change ? toggle_change.first : public_send("share_#{surface}?")
    prev_slug.present? && prev_flag
  end

  def payload_for(surface)
    case surface
    when :portfolio then PortfolioPayloadBuilder.call(self)
    when :radar     then RadarPayloadBuilder.call(self)
    end
  end
end
