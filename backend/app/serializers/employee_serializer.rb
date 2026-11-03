# The JSON shape of an employee. Adds currency, country name and the USD
# salary so the frontend never needs its own copy of the rate table.
module EmployeeSerializer
  SUMMARY_FIELDS = %i[id employee_code first_name last_name job_title department country_code salary].freeze
  FIELDS = (SUMMARY_FIELDS + %i[email employment_type hire_date]).freeze

  module_function

  def call(employee)
    employee.slice(*FIELDS).symbolize_keys.merge(money(employee))
  end

  def summary(employee)
    employee.slice(*SUMMARY_FIELDS).symbolize_keys.merge(money(employee))
  end

  def with_history(employee)
    call(employee).merge(
      salary_revisions: employee.salary_revisions.order(created_at: :desc, id: :desc).map do |revision|
        revision.slice(:id, :previous_salary, :new_salary, :reason, :created_at).symbolize_keys
      end
    )
  end

  def money(employee)
    {
      full_name: employee.full_name,
      country_name: employee.country&.name,
      currency: employee.currency,
      salary_usd: employee.salary_usd
    }
  end
end
