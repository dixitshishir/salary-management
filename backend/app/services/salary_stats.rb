# Summary statistics for a list of salaries, in whole currency units.
#
# Pure Ruby so the maths is unit-tested without a database, and because
# SQLite has no median or percentile functions. Percentiles use linear
# interpolation, matching Postgres' percentile_cont, so moving this into SQL
# later gives the same numbers.
class SalaryStats
  attr_reader :count, :total, :min, :max, :mean, :median, :p25, :p75

  def initialize(salaries)
    sorted = salaries.sort
    @count = sorted.size
    @total = sorted.sum
    @min = sorted.first
    @max = sorted.last
    @mean = count.zero? ? nil : Rational(total, count).round
    @p25 = percentile(sorted, 25)
    @median = percentile(sorted, 50)
    @p75 = percentile(sorted, 75)
  end

  def to_h
    { count:, total:, min:, max:, mean:, median:, p25:, p75: }
  end

  private

  def percentile(sorted, pct)
    return nil if sorted.empty?

    rank = Rational(pct * (sorted.size - 1), 100)
    lower = sorted[rank.floor]
    upper = sorted[rank.ceil]
    (lower + (upper - lower) * (rank - rank.floor)).round
  end
end
