module Api
  module V1
    # API endpoints for user registration.
    # Handles creating new user accounts via email/password.
    class RegistrationsController < BaseController
      allow_unauthenticated_access only: [ :create ]

      # Rate limit registration attempts to prevent abuse
      rate_limit to: 5, within: 1.hour, only: :create, with: -> {
        render json: { success: false, error: "Too many registration attempts. Try again later." },
               status: :too_many_requests
      }

      # POST /api/v1/users
      # Create a new user account
      def create
        user = User.new(user_params)

        if user.save
          start_new_session_for(user)
          render_success(serialize_user(user), status: :created)
        else
          render_error(user.errors.full_messages.join(", "), status: :unprocessable_entity)
        end
      end

      private

      def user_params
        params.permit(:email_address, :password, :password_confirmation)
      end

      def serialize_user(user)
        {
          id: user.id,
          emailAddress: user.email_address,
          name: user.name,
          admin: user.admin?
        }
      end
    end
  end
end
