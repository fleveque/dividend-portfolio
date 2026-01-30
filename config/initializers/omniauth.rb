# OmniAuth configuration for OAuth providers
#
# Environment variables required:
# - GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
# - GOOGLE_CLIENT_SECRET: OAuth client secret from Google Cloud Console
#
# Setup instructions:
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Create OAuth 2.0 Client ID
# 3. Add authorized redirect URI: http://localhost:3000/auth/google_oauth2/callback
# 4. For production, add your production domain's callback URL
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV["GOOGLE_CLIENT_ID"],
    ENV["GOOGLE_CLIENT_SECRET"],
    {
      scope: "email,profile",
      prompt: "select_account",
      image_aspect_ratio: "square",
      image_size: 50
    }
end

# Handle OAuth failures gracefully
OmniAuth.config.on_failure = proc { |env|
  OmniauthCallbacksController.action(:failure).call(env)
}
