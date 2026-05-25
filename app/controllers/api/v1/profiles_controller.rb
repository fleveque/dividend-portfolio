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
          shareRadar: Current.user.share_radar
        }
      end

      def profile_params
        permitted = params.permit(:portfolio_slug, :preferred_currency, :locale, :share_portfolio, :share_radar)
        permitted[:portfolio_slug] = nil if permitted.key?(:portfolio_slug) && permitted[:portfolio_slug].blank?
        # Coerce form-y string booleans to real booleans so AR doesn't choke.
        %i[share_portfolio share_radar].each do |k|
          permitted[k] = ActiveModel::Type::Boolean.new.cast(permitted[k]) if permitted.key?(k)
        end
        permitted
      end
    end
  end
end
