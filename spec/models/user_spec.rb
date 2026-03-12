RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_many(:sessions).dependent(:destroy) }
    it { should have_many(:transactions) }
    it { should have_many(:dividends) }
    it { should have_one(:radar) }
    it { should have_many(:stocks).through(:transactions) }
    it { should have_many(:holdings).dependent(:delete_all) }
  end

  describe 'validations' do
    subject { build(:user) }  # Ensure a valid user instance is used for uniqueness validation

    it { should validate_presence_of(:email_address) }
    it { should validate_uniqueness_of(:email_address).case_insensitive }
    it { should validate_presence_of(:password).on(:create) }
    it { should validate_length_of(:password).is_at_least(6) }
    it { should validate_uniqueness_of(:portfolio_slug) }
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
