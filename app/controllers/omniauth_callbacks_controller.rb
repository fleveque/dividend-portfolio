# Handles OAuth callbacks from providers like Google.
# This controller receives the OAuth response after the user authenticates
# with the external provider and creates/finds the user in our system.
class OmniauthCallbacksController < ApplicationController
  include Authentication

  allow_unauthenticated_access only: [ :google_oauth2, :failure ]

  # GET/POST /auth/google_oauth2/callback
  # Called by Google after user authenticates
  def google_oauth2
    user = User.from_omniauth(auth_hash)

    if user.persisted?
      start_new_session_for(user)
      redirect_to root_path, notice: "Signed in with Google"
    else
      redirect_to root_path, alert: "Could not sign in with Google: #{user.errors.full_messages.join(', ')}"
    end
  end

  # GET /auth/failure
  # Called when OAuth authentication fails
  def failure
    redirect_to root_path, alert: "Authentication failed: #{params[:message]}"
  end

  private

  def auth_hash
    request.env["omniauth.auth"]
  end
end
