# Filtering, search and sorting for the employee directory.
# Only whitelisted columns reach ORDER BY; search terms are escaped for LIKE.
class EmployeeSearch
  SORTABLE = {
    "name" => %i[last_name first_name],
    "employee_code" => %i[employee_code],
    "job_title" => %i[job_title],
    "department" => %i[department],
    "country_code" => %i[country_code],
    "salary" => %i[salary],
    "hire_date" => %i[hire_date]
  }.freeze
  SEARCHABLE = %i[first_name last_name email employee_code].freeze
  FILTERS = %i[country_code department job_title employment_type].freeze

  def initialize(params, scope: Employee.all)
    @params = params
    @scope = scope
  end

  def call
    filtered = @scope.where(filters)
    filtered = search(filtered)
    filtered.order(order)
  end

  private

  def filters
    FILTERS.index_with { |key| @params[key].presence }.compact
  end

  # Every word must match at least one searchable column, so "asha rao"
  # finds Asha Rao but not Asha Menon or Ravi Rao.
  def search(relation)
    terms = @params[:q].to_s.split.first(5)
    table = Employee.arel_table

    terms.reduce(relation) do |rel, term|
      pattern = "%#{Employee.sanitize_sql_like(term)}%"
      rel.where(SEARCHABLE.map { |col| table[col].matches(pattern, "\\") }.reduce(:or))
    end
  end

  def order
    columns = SORTABLE.fetch(@params[:sort].to_s, SORTABLE["employee_code"])
    direction = @params[:direction].to_s == "desc" ? :desc : :asc
    columns.to_h { |col| [ col, direction ] }.merge(id: direction)
  end
end
