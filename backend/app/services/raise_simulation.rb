# "What would an X% raise cost?" Read-only: computes the cost of a raise for
# everyone matching the filters and changes nobody's salary.
class RaiseSimulation
  FILTERS = %i[country_code department job_title].freeze
  InvalidInput = Class.new(ArgumentError)

  def initialize(percent:, **filters)
    @percent = percent.to_s.to_r
    @filters = filters.slice(*FILTERS).compact_blank
  end

  def call
    raise InvalidInput, "percent must be between 0 and 100" unless @percent.positive? && @percent <= 100

    by_country = Employee.where(@filters).pluck(:country_code, :salary)
                         .group_by(&:first)
                         .map { |code, rows| country_cost(Country.find(code), rows.map(&:last)) }
                         .sort_by { |row| -row[:raise_cost_usd] }

    current_usd = by_country.sum { |row| row[:current_payroll_usd] }
    raise_usd = by_country.sum { |row| row[:raise_cost_usd] }

    {
      percent: @percent.to_f,
      filters: @filters,
      affected_headcount: by_country.sum { |row| row[:headcount] },
      current_payroll_usd: current_usd,
      raise_cost_usd: raise_usd,
      new_payroll_usd: current_usd + raise_usd,
      by_country: by_country.map { |row| row.except(:current_payroll_usd) }
    }
  end

  private

  def country_cost(country, salaries)
    current = salaries.sum
    # Each person's raise is rounded to whole units, as it would be on a payslip.
    raise_cost = salaries.sum { |salary| (salary * @percent / 100).round }
    {
      country_code: country.code,
      currency: country.currency,
      headcount: salaries.size,
      current_payroll: current,
      raise_cost:,
      raise_cost_usd: country.to_usd(raise_cost),
      current_payroll_usd: country.to_usd(current)
    }
  end
end
