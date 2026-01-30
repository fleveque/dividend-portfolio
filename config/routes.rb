Rails.application.routes.draw do
  # Password reset routes (not migrated to React)
  resources :passwords, param: :token

  # Health check for load balancers and uptime monitors
  get "up" => "rails/health#show", as: :rails_health_check

  # OAuth routes
  # OmniAuth handles /auth/:provider - we just need the callback routes
  get "/auth/:provider/callback", to: "omniauth_callbacks#google_oauth2", as: :omniauth_callback
  get "/auth/failure", to: "omniauth_callbacks#failure", as: :omniauth_failure

  # React SPA - served at root
  # React Router handles client-side navigation for all non-API routes
  root "react#index"

  # JSON API for React frontend
  # Versioned namespace allows future API changes without breaking existing clients
  namespace :api do
    namespace :v1 do
      # Stock endpoints - public (no auth required for browsing)
      resources :stocks, only: [ :index, :show ] do
        collection do
          get :last_added   # GET /api/v1/stocks/last_added
          get :most_added   # GET /api/v1/stocks/most_added
          get :search       # GET /api/v1/stocks/search?query=AAPL
        end
      end

      # Radar endpoints - authenticated (user's personal watchlist)
      resource :radar, only: [ :show ] do
        post "stocks/:stock_id", action: :add_stock, as: :add_stock
        delete "stocks/:stock_id", action: :remove_stock, as: :remove_stock
        patch "stocks/:stock_id/target_price", action: :update_target_price, as: :update_target_price
      end

      # Session endpoints - for React authentication
      resource :session, only: [ :show, :create, :destroy ]

      # Registration endpoint - for React sign-up
      resources :users, only: [ :create ], controller: "registrations"
    end
  end

  # Catch-all route for React Router (must be last)
  # Excludes API routes and asset paths so they don't get handled by React
  get "*path", to: "react#index", constraints: ->(req) {
    !req.path.start_with?("/api/", "/assets/", "/up", "/passwords", "/auth/")
  }
end
