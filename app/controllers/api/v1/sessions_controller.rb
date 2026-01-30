module Api
  module V1
    # API endpoints for authentication.
    # Handles login, logout, and checking current session status.
    class SessionsController < BaseController
      # Login, session check, and logout don't require existing authentication
      # - show: Check if logged in
      # - create: Login
      # - destroy: Logout (should work even if session expired)
      allow_unauthenticated_access only: [ :show, :create, :destroy ]

      # Rate limit login attempts to prevent brute force attacks
      rate_limit to: 10, within: 3.minutes, only: :create, with: -> {
        render json: { success: false, error: "Too many attempts. Try again later." },
               status: :too_many_requests
      }

      # GET /api/v1/session
      # Check if user is currently authenticated
      # Returns user data if authenticated, null if not
      def show
        if authenticated?
          render_success(serialize_user(Current.user))
        else
          render_success(nil)
        end
      end

      # POST /api/v1/session
      # Login with email and password
      # Sets session cookie on success
      def create
        user = User.authenticate_by(session_params)

        if user
          start_new_session_for(user)
          render_success(serialize_user(user), status: :created)
        else
          render_error("Invalid email or password", status: :unauthorized)
        end
      end

      # DELETE /api/v1/session
      # Logout - destroys the current session
      def destroy
        # Must call authenticated? to load Current.session since this action
        # is in allow_unauthenticated_access (resume_session isn't called automatically)
        terminate_session if authenticated?
        render_success({ logged_out: true })
      end

      private

      def session_params
        params.permit(:email_address, :password)
      end

      def serialize_user(user)
        {
          id: user.id,
          emailAddress: user.email_address
        }
      end
    end
  end
end
