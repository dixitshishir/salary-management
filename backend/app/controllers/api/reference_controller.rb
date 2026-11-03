module Api
  # Lookup lists for forms and filters, so the UI never hard-codes them.
  class ReferenceController < ApplicationController
    def show
      render json: {
        countries: Country.all.map { |c| { code: c.code, name: c.name, currency: c.currency } },
        departments: Employee.distinct.order(:department).pluck(:department),
        job_titles: Employee.distinct.order(:job_title).pluck(:job_title),
        employment_types: Employee::EMPLOYMENT_TYPES,
        rates_as_of: Country.rates_as_of
      }
    end
  end
end
