Rails.application.routes.draw do
  # React test page - visit /react-test to verify Vite + React setup
  # Remove this route once the migration is complete
  get "react-test", to: "react_test#index"

  get "home/index"
  resource :session
  resources :passwords, param: :token
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "home#index"

  resource :radar, only: [ :show, :create, :update ] do
    get "search", on: :member
    member do
      patch "stocks/:stock_id", action: :update, as: :update_stock
      delete "stocks/:stock_id", action: :destroy_stock, as: :destroy_stock
    end
  end

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
    end
  end
end
