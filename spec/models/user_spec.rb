RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_many(:sessions).dependent(:destroy) }
    it { should have_many(:transactions) }
    it { should have_many(:dividends) }
    it { should have_one(:radar) }
    it { should have_many(:stocks).through(:transactions) }
  end

  describe 'validations' do
    subject { build(:user) }  # Ensure a valid user instance is used for uniqueness validation

    it { should validate_presence_of(:email_address) }
    it { should validate_uniqueness_of(:email_address).case_insensitive }
    it { should validate_presence_of(:password).on(:create) }
    it { should validate_length_of(:password).is_at_least(6) }
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
