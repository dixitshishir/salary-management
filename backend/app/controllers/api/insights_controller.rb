module Api
  class InsightsController < ApplicationController
    def overview
      render json: PayInsights.new.overview
    end

    def countries
      render json: PayInsights.new.by_country
    end

    def job_titles
      country = Country.find(params.require(:country_code))
      return render json: { error: "Unknown country" }, status: :bad_request unless country

      render json: {
        country_code: country.code,
        country_name: country.name,
        currency: country.currency,
        job_titles: PayInsights.new.by_job_title(country.code)
      }
    end

    def outliers
      threshold = params.fetch(:threshold, 0.2).to_s.to_r.clamp(Rational(1, 20), 1)
      render json: PayOutliers.new(threshold:, country_code: params[:country_code]).call
    end

    def raise_simulation
      filters = params.permit(*RaiseSimulation::FILTERS).to_h.symbolize_keys
      render json: RaiseSimulation.new(percent: params.require(:percent), **filters).call
    rescue RaiseSimulation::InvalidInput => e
      render json: { error: e.message }, status: :unprocessable_content
    end
  end
end
