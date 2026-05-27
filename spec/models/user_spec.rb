RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_many(:sessions).dependent(:destroy) }
    it { should have_many(:dividends) }
    it { should have_one(:radar) }
    it { should have_many(:holdings).dependent(:delete_all) }
  end

  describe 'validations' do
    subject { build(:user) }  # Ensure a valid user instance is used for uniqueness validation

    it { should validate_presence_of(:email_address) }
    it { should validate_uniqueness_of(:email_address).case_insensitive }
    it { should validate_presence_of(:password).on(:create) }
    it { should validate_length_of(:password).is_at_least(6) }
    it { should validate_uniqueness_of(:portfolio_slug) }
    it { should validate_presence_of(:preferred_currency) }
    it { should validate_inclusion_of(:preferred_currency).in_array(Stock::CURRENCY_SYMBOLS.keys) }
    it { should validate_presence_of(:locale) }
    it { should validate_inclusion_of(:locale).in_array(User::SUPPORTED_LOCALES) }
  end

  describe 'motivation fields' do
    it 'accepts nil for every motivation input' do
      expect(build(:user, motivation_monthly_invest: nil,
                          motivation_monthly_objective: nil,
                          motivation_inflation_pct: nil,
                          motivation_yield_override_pct: nil)).to be_valid
    end

    it 'rejects a negative monthly invest' do
      expect(build(:user, motivation_monthly_invest: -1)).not_to be_valid
    end

    it 'rejects a negative monthly objective' do
      expect(build(:user, motivation_monthly_objective: -1)).not_to be_valid
    end

    it 'allows a negative inflation pct (deflation scenarios)' do
      expect(build(:user, motivation_inflation_pct: -1)).to be_valid
    end

    it 'rejects a wildly large inflation pct' do
      expect(build(:user, motivation_inflation_pct: 200)).not_to be_valid
    end

    it 'rejects a negative yield override' do
      expect(build(:user, motivation_yield_override_pct: -0.1)).not_to be_valid
    end

    it 'rejects a yield override above 100%' do
      expect(build(:user, motivation_yield_override_pct: 101)).not_to be_valid
    end

    it 'accepts nil for the capital-pool fields' do
      expect(build(:user, motivation_interest_capital: nil,
                          motivation_interest_rate_pct: nil,
                          motivation_growth_capital: nil,
                          motivation_growth_rate_pct: nil)).to be_valid
    end

    it 'rejects a negative interest capital' do
      expect(build(:user, motivation_interest_capital: -1)).not_to be_valid
    end

    it 'rejects an interest rate above 100%' do
      expect(build(:user, motivation_interest_rate_pct: 150)).not_to be_valid
    end

    it 'rejects a negative growth capital' do
      expect(build(:user, motivation_growth_capital: -1)).not_to be_valid
    end

    it 'allows a slightly negative growth rate (down-cycles)' do
      expect(build(:user, motivation_growth_rate_pct: -5)).to be_valid
    end

    it 'defaults motivation_reinvest_interest to true' do
      expect(create(:user).motivation_reinvest_interest).to be(true)
    end
  end

  describe 'preferred_currency' do
    it 'defaults to USD' do
      expect(create(:user).preferred_currency).to eq("USD")
    end

    it 'accepts a supported currency' do
      expect(build(:user, preferred_currency: "EUR")).to be_valid
    end

    it 'rejects an unsupported currency' do
      expect(build(:user, preferred_currency: "XYZ")).not_to be_valid
    end
  end

  describe 'portfolio_slug validation' do
    it 'accepts valid slugs' do
      user = build(:user, portfolio_slug: 'my-portfolio')
      expect(user).to be_valid
    end

    it 'rejects slugs shorter than 3 characters' do
      user = build(:user, portfolio_slug: 'ab')
      expect(user).not_to be_valid
    end

    it 'rejects slugs with uppercase' do
      user = build(:user, portfolio_slug: 'MyPortfolio')
      expect(user).not_to be_valid
    end

    it 'allows nil slug' do
      user = build(:user, portfolio_slug: nil)
      expect(user).to be_valid
    end
  end

  describe 'NATS callbacks' do
    it 'publishes portfolio.opted_in when slug is set' do
      user = create(:user)
      expect(NatsPublisher).to receive(:publish).with("portfolio.opted_in", hash_including(slug: "my-slug"))

      user.update!(portfolio_slug: "my-slug")
    end

    it 'includes price in opted_in payload' do
      user = create(:user)
      stock = create(:stock, price: 175.0)
      create(:holding, user: user, stock: stock)

      expect(NatsPublisher).to receive(:publish).with(
        "portfolio.opted_in",
        hash_including(holdings: array_including(hash_including(price: 175.0)))
      )

      user.update!(portfolio_slug: "price-slug")
    end

    it 'publishes portfolio.opted_out when slug is cleared' do
      user = create(:user, portfolio_slug: "old-slug")
      expect(NatsPublisher).to receive(:publish).with("portfolio.opted_out", hash_including(slug: "old-slug"))

      user.update!(portfolio_slug: nil)
    end
  end

  describe 'callbacks' do
    it 'normalizes the email address before saving' do
      user = create(:user, email_address: ' EXAMPLE@DOMAIN.COM ')
      expect(user.email_address).to eq('example@domain.com')
    end
  end

  describe 'secure password' do
    it 'authenticates with a valid password' do
      user = create(:user, password: 'password123')
      expect(user.authenticate('password123')).to be_truthy
    end

    it 'does not authenticate with an invalid password' do
      user = create(:user, password: 'password123')
      expect(user.authenticate('wrongpassword')).to be_falsey
    end
  end
end
