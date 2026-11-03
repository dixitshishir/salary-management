# Flags employees paid unusually far from their peers: same job title, same
# country. Uses the compa-ratio (salary / peer median), the measure HR teams
# already use for pay bands.
class PayOutliers
  # Below this, one person moves the median too much for a fair comparison.
  MIN_PEER_GROUP = 5

  def initialize(threshold: 0.2, country_code: nil, limit: 100, scope: Employee.all)
    @threshold = threshold.to_r
    @country_code = country_code.presence
    @limit = limit
    @scope = scope
  end

  def call
    flagged = peer_groups.flat_map { |peers| outliers_in(peers) }
                         .sort_by { |outlier| -(outlier[:compa_ratio] - 1).abs }
    { threshold: @threshold.to_f, total_count: flagged.size, outliers: flagged.first(@limit) }
  end

  private

  def peer_groups
    scope = @country_code ? @scope.where(country_code: @country_code) : @scope
    scope.select(:id, :employee_code, :first_name, :last_name, :job_title, :department, :country_code, :salary)
         .group_by { |employee| [ employee.country_code, employee.job_title ] }
         .values
         .select { |peers| peers.size >= MIN_PEER_GROUP }
  end

  def outliers_in(peers)
    median = SalaryStats.new(peers.map(&:salary)).median
    peers.filter_map do |employee|
      ratio = Rational(employee.salary, median)
      next if (ratio - 1).abs <= @threshold

      {
        employee: EmployeeSerializer.summary(employee),
        peer_median: median,
        peer_count: peers.size,
        compa_ratio: ratio.to_f.round(2),
        direction: ratio > 1 ? "above" : "below"
      }
    end
  end
end
