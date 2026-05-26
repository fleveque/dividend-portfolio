require 'rails_helper'

RSpec.describe MotivationProjectionService do
  describe '.simulate' do
    it 'returns reached=true at year 0 when current yield already covers the objective' do
      result = described_class.simulate(
        portfolio_value: 1_000_000,
        yield_rate: 0.05,            # 50000/yr -> 4166/mo
        inflation_rate: 0.02,
        monthly_invest_real: 0,
        monthly_objective_real: 1000
      )

      expect(result.reached).to be(true)
      expect(result.years).to eq(0)
      expect(result.months).to eq(0)
    end

    it 'projects a finite number of years for a modest plan' do
      result = described_class.simulate(
        portfolio_value: 50_000,
        yield_rate: 0.04,
        inflation_rate: 0.025,
        monthly_invest_real: 1000,
        monthly_objective_real: 2000
      )

      expect(result.reached).to be(true)
      expect(result.years).to be_between(10, 35)
      expect(result.final_portfolio_nominal).to be > result.final_portfolio_real
      expect(result.total_contributed_nominal).to be > 0
    end

    it 'gives up after max_years for an unreachable plan' do
      result = described_class.simulate(
        portfolio_value: 0,
        yield_rate: 0.01,
        inflation_rate: 0.05,           # objective inflates faster than yield growth
        monthly_invest_real: 10,
        monthly_objective_real: 5000,
        max_years: 30
      )

      expect(result.reached).to be(false)
      expect(result.years).to eq(30)
    end

    it 'does not divide by zero when yield is zero' do
      result = described_class.simulate(
        portfolio_value: 1000,
        yield_rate: 0.0,
        inflation_rate: 0.02,
        monthly_invest_real: 100,
        monthly_objective_real: 500
      )

      expect(result.reached).to be(false) # nominal yield will never reach objective
      expect(result.current_monthly_dividend).to eq(0)
    end

    it 'reports progress_pct based on current dividend vs today objective' do
      result = described_class.simulate(
        portfolio_value: 100_000,
        yield_rate: 0.04,  # 4000/yr -> 333.33/mo
        inflation_rate: 0.02,
        monthly_invest_real: 0,
        monthly_objective_real: 1000
      )

      expect(result.progress_pct).to be_within(0.5).of(33.33)
    end
  end

  describe '.call' do
    let(:user) do
      create(:user,
             preferred_currency: "USD",
             motivation_monthly_invest: 1000,
             motivation_monthly_objective: 2000,
             motivation_inflation_pct: 2.5,
             motivation_yield_override_pct: 4)
    end

    it 'returns nil when the user has not set the motivation inputs' do
      bare = create(:user)
      expect(described_class.call(bare)).to be_nil
    end

    it 'uses the override yield when set and a zero portfolio is acceptable' do
      summary = described_class.call(user)
      expect(summary).not_to be_nil
      expect(summary.currency).to eq("USD")
    end
  end

  describe '.cached_summary' do
    let(:user) do
      create(:user,
             motivation_monthly_invest: 1000,
             motivation_monthly_objective: 2000,
             motivation_yield_override_pct: 4)
    end

    it 'memoizes the result and invalidates on input change' do
      first = described_class.cached_summary(user)
      expect(described_class).not_to receive(:call)
      described_class.cached_summary(user)

      RSpec::Mocks.space.proxy_for(described_class).reset
      user.update!(motivation_monthly_objective: 5000)
      after_change = described_class.cached_summary(user)
      expect(after_change.years).not_to eq(first.years)
    end
  end
end
