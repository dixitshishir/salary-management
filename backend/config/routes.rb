Rails.application.routes.draw do
  namespace :api do
    resources :employees, only: %i[index show create update destroy] do
      collection do
        get :export
        post :import
      end
    end

    get "reference", to: "reference#show"

    scope "insights", controller: :insights, as: :insights do
      get :overview
      get :countries
      get :job_titles
      get :outliers
      post :raise_simulation
    end
  end

  # Health check for load balancers and uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # Everything else is a page of the React app.
  root "frontend#index"
  get "*path", to: "frontend#index", constraints: ->(request) { !request.path.start_with?("/api") && request.format.html? }
end
