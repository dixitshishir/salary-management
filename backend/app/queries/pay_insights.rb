# Answers "how do we pay people?" for the HR Manager.
#
# Grouping happens on plucked (group, salary) pairs instead of SQL GROUP BY
# because medians and percentiles are part of every answer and SQLite can't
# compute them. At 10k employees that is ~10k integers per call (a few ms).
# On Postgres, this would become one GROUP BY with percentile_cont.
class PayInsights
  def initialize(scope = Employee.all)
    @scope = scope
  end

  def by_country
    @scope.pluck(:country_code, :salary)
          .group_by(&:first)
          .map { |code, rows| country_row(Country.find(code), rows.map(&:last)) }
          .sort_by { |row| [ -row[:headcount], row[:country_code] ] }
  end

  def by_job_title(country_code)
    @scope.where(country_code:)
          .pluck(:job_title, :salary)
          .group_by(&:first)
          .map { |title, rows| { job_title: title, headcount: rows.size, **stats_without_count(rows.map(&:last)) } }
          .sort_by { |row| [ -row[:median], row[:job_title] ] }
  end

  def overview
    rows = @scope.pluck(:country_code, :department, :salary)
                 .map { |code, department, salary| [ code, department, Country.find(code).to_usd(salary) ] }
    usd = SalaryStats.new(rows.map(&:last))

    {
      headcount: usd.count,
      country_count: rows.map(&:first).uniq.size,
      total_payroll_usd: usd.total,
      median_salary_usd: usd.median,
      mean_salary_usd: usd.mean,
      rates_as_of: Country.rates_as_of,
      departments: department_rows(rows)
    }
  end

  private

  def country_row(country, salaries)
    stats = SalaryStats.new(salaries)
    {
      country_code: country.code,
      country_name: country.name,
      currency: country.currency,
      headcount: stats.count,
      **stats_without_count(salaries, stats),
      mean_usd: country.to_usd(stats.mean),
      median_usd: country.to_usd(stats.median)
    }
  end

  def department_rows(rows)
    rows.group_by { |_, department, _| department }.map do |department, members|
      stats = SalaryStats.new(members.map(&:last))
      { department:, headcount: stats.count, total_payroll_usd: stats.total, median_salary_usd: stats.median }
    end.sort_by { |row| -row[:total_payroll_usd] }
  end

  def stats_without_count(salaries, stats = SalaryStats.new(salaries))
    stats.to_h.except(:count, :total)
  end
end
