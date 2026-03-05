module Api
  module V1
    class ProfilesController < BaseController
      # GET /api/v1/profile
      def show
        render_success({
          id: Current.user.id,
          emailAddress: Current.user.email_address,
          portfolioSlug: Current.user.portfolio_slug
        })
      end

      # PATCH /api/v1/profile
      def update
        if Current.user.update(profile_params)
          render_success({
            id: Current.user.id,
            emailAddress: Current.user.email_address,
            portfolioSlug: Current.user.portfolio_slug
          })
        else
          render_error(Current.user.errors.full_messages.join(", "))
        end
      end

      private

      def profile_params
        permitted = params.permit(:portfolio_slug)
        permitted[:portfolio_slug] = nil if permitted[:portfolio_slug].blank?
        permitted
      end
    end
  end
end
