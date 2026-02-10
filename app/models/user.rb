class User < ApplicationRecord
  has_secure_password validations: false
  has_many :sessions, dependent: :destroy
  has_many :transactions, dependent: :delete_all
  has_many :dividends, dependent: :delete_all
  has_one :radar, dependent: :destroy
  has_one :buy_plan, dependent: :destroy
  has_many :stocks, through: :transactions

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  validates :email_address, presence: true, uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, on: :create, unless: :oauth_user?

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
end
