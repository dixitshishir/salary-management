# Flags employees paid unusually far from their peers: same job title, same
# country. Uses the compa-ratio (salary / peer median), the measure HR teams
# already use for pay bands.
#
# Works on plucked (id, group, salary) rows and only loads full records for
# the flagged employees it returns, so 10k peers never become 10k AR objects.
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
                         .sort_by { |outlier| [ -(outlier[:ratio] - 1).abs, outlier[:id] ] }
    shown = flagged.first(@limit)
    employees = Employee.where(id: shown.map { |outlier| outlier[:id] }).index_by(&:id)

    {
      threshold: @threshold.to_f,
      total_count: flagged.size,
      outliers: shown.map { |outlier| present(outlier, employees.fetch(outlier[:id])) }
    }
  end

  private

  def peer_groups
    scope = @country_code ? @scope.where(country_code: @country_code) : @scope
    scope.pluck(:id, :country_code, :job_title, :salary)
         .group_by { |_id, country_code, job_title, _salary| [ country_code, job_title ] }
         .values
         .select { |peers| peers.size >= MIN_PEER_GROUP }
  end

  def outliers_in(peers)
    median = SalaryStats.new(peers.map(&:last)).median
    peers.filter_map do |id, _country_code, _job_title, salary|
      ratio = Rational(salary, median)
      next if (ratio - 1).abs <= @threshold

      { id:, ratio:, peer_median: median, peer_count: peers.size }
    end
  end

  def present(outlier, employee)
    {
      employee: EmployeeSerializer.summary(employee),
      peer_median: outlier[:peer_median],
      peer_count: outlier[:peer_count],
      compa_ratio: outlier[:ratio].to_f.round(2),
      direction: outlier[:ratio] > 1 ? "above" : "below"
    }
  end
end
