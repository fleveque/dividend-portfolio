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
end
