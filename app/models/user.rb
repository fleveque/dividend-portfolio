class User < ApplicationRecord
  has_secure_password validations: false
  has_many :sessions, dependent: :destroy
  has_many :transactions, dependent: :delete_all
  has_many :dividends, dependent: :delete_all
  has_one :radar, dependent: :destroy
  has_one :buy_plan, dependent: :destroy
  has_many :stocks, through: :transactions
  has_many :holdings, dependent: :delete_all

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  validates :email_address, presence: true, uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, on: :create, unless: :oauth_user?
  validates :portfolio_slug, uniqueness: true, allow_nil: true,
    format: { with: /\A[a-z0-9][a-z0-9-]{1,38}[a-z0-9]\z/, message: "must be 3-40 lowercase alphanumeric characters or hyphens" },
    if: -> { portfolio_slug.present? }

  after_commit :publish_portfolio_slug_change, if: :saved_change_to_portfolio_slug?

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

  def publish_portfolio_slug_change
    if portfolio_slug.present?
      NatsPublisher.publish("portfolio.opted_in", {
        slug: portfolio_slug,
        holdings: holdings.includes(:stock).map { |h|
          { symbol: h.stock.symbol, quantity: h.quantity.to_f, avg_price: h.average_price.to_f }
        }
      })
    else
      previous_slug = saved_change_to_portfolio_slug.first
      NatsPublisher.publish("portfolio.opted_out", { slug: previous_slug }) if previous_slug.present?
    end
  end
end
