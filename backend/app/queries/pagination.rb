# Offset pagination with a hard cap on page size. At 10k rows LIMIT/OFFSET on
# indexed filters is a few milliseconds; keyset pagination only pays off at
# millions of rows.
class Pagination
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  attr_reader :page, :per_page

  def initialize(relation, page:, per_page:)
    @relation = relation
    @page = [ page.to_i, 1 ].max
    @per_page = per_page.to_i.positive? ? [ per_page.to_i, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE
  end

  def records
    @relation.limit(per_page).offset((page - 1) * per_page)
  end

  def total_count
    @total_count ||= @relation.count
  end

  def meta
    { page:, per_page:, total_count:, total_pages: (total_count.to_f / per_page).ceil }
  end
end
