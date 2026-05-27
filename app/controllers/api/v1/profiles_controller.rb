module Api
  module V1
    class ProfilesController < BaseController
      # GET /api/v1/profile
      def show
        render_success(serialize_profile)
      end

      # PATCH /api/v1/profile
      def update
        if Current.user.update(profile_params)
          render_success(serialize_profile)
        else
          render_error(Current.user.errors.full_messages.join(", "))
        end
      end

      private

      def serialize_profile
        {
          id: Current.user.id,
          emailAddress: Current.user.email_address,
          portfolioSlug: Current.user.portfolio_slug,
          preferredCurrency: Current.user.preferred_currency,
          locale: Current.user.locale,
          sharePortfolio: Current.user.share_portfolio,
          shareRadar: Current.user.share_radar,
          motivationMonthlyInvest: Current.user.motivation_monthly_invest&.to_f,
          motivationMonthlyObjective: Current.user.motivation_monthly_objective&.to_f,
          motivationInflationPct: Current.user.motivation_inflation_pct&.to_f,
          motivationYieldOverridePct: Current.user.motivation_yield_override_pct&.to_f,
          motivationStartYear: Current.user.motivation_start_year,
          motivationInterestCapital: Current.user.motivation_interest_capital&.to_f,
          motivationInterestRatePct: Current.user.motivation_interest_rate_pct&.to_f,
          motivationGrowthCapital: Current.user.motivation_growth_capital&.to_f,
          motivationGrowthRatePct: Current.user.motivation_growth_rate_pct&.to_f,
          motivationReinvestInterest: Current.user.motivation_reinvest_interest,
          motivationBirthYear: Current.user.motivation_birth_year,
          motivationRetirementAge: Current.user.motivation_retirement_age,
          motivationSummary: serialize_motivation_summary
        }
      end

      def serialize_motivation_summary
        summary = MotivationProjectionService.cached_summary(Current.user)
        return nil unless summary

        {
          reached: summary.reached,
          years: summary.years,
          months: summary.months,
          days: summary.days,
          totalDays: summary.total_days,
          finalPortfolioNominal: summary.final_portfolio_nominal,
          finalPortfolioReal: summary.final_portfolio_real,
          totalContributedNominal: summary.total_contributed_nominal,
          totalYieldEarnedNominal: summary.total_yield_earned_nominal,
          currentMonthlyDividend: summary.current_monthly_dividend,
          progressPct: summary.progress_pct,
          currency: summary.currency,
          yearsSustainedPostGoal: summary.years_sustained_post_goal,
          yearsUntilCapitalGone: summary.years_until_capital_gone
        }
      end

      def profile_params
        permitted = params.permit(
          :portfolio_slug, :preferred_currency, :locale,
          :share_portfolio, :share_radar,
          :motivation_monthly_invest, :motivation_monthly_objective,
          :motivation_inflation_pct, :motivation_yield_override_pct,
          :motivation_start_year,
          :motivation_interest_capital, :motivation_interest_rate_pct,
          :motivation_growth_capital, :motivation_growth_rate_pct,
          :motivation_reinvest_interest,
          :motivation_birth_year,
          :motivation_retirement_age
        )
        permitted[:portfolio_slug] = nil if permitted.key?(:portfolio_slug) && permitted[:portfolio_slug].blank?
        # Coerce form-y string booleans to real booleans so AR doesn't choke.
        %i[share_portfolio share_radar motivation_reinvest_interest].each do |k|
          permitted[k] = ActiveModel::Type::Boolean.new.cast(permitted[k]) if permitted.key?(k)
        end
        # Empty string → nil for the motivation decimals so a user clearing a
        # field doesn't write a 0 they didn't intend.
        %i[motivation_monthly_invest motivation_monthly_objective
           motivation_inflation_pct motivation_yield_override_pct
           motivation_start_year
           motivation_interest_capital motivation_interest_rate_pct
           motivation_growth_capital motivation_growth_rate_pct
           motivation_birth_year motivation_retirement_age].each do |k|
          permitted[k] = nil if permitted.key?(k) && permitted[k].to_s.strip.empty?
        end
        permitted
      end
    end
  end
end
