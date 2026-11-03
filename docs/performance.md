# Performance considerations

The brief sets the scale at **10,000 employees**. All 10,000 rows fit in about 2 MB of SQLite,
so the aim was "obviously fast at 10k, with a clear path if it grows", not premature
optimisation.

## Where the time goes

| Path | Approach | Why it holds at 10k | What changes at 1M |
|------|----------|---------------------|--------------------|
| Employee directory | Server-side `LIMIT/OFFSET`, page size capped at 100; filters on indexed columns; one `COUNT(*)` per page | The browser never holds more than 100 rows; each query touches an index | Keyset pagination (`WHERE (sort_key, id) > ...`), plus full-text search (FTS5 / Postgres `tsvector`) instead of `LIKE '%term%'` |
| Search | Each word must match name, email or code (`LIKE`, wildcards escaped) | A scan of 10k short strings costs milliseconds | Full-text index |
| Pay insights | One `pluck` of `(group, salary)` pairs per request; stats computed in Ruby | About 10k integers, sorted per group, in milliseconds. SQLite has no median function | Postgres `percentile_cont` in a single `GROUP BY`, or summary tables refreshed on write |
| Pay outliers | Group by `(country, job title)` and compute each group's median | O(n log n) over 10k rows | Same summary tables; flag on write |
| Raise planner | One filtered `pluck`, summed per country | Read-only and indexed | `SUM()` in SQL |
| CSV import | One transaction around per-row saves (validation and salary history still run per row); 5 MB / 20k-row cap | SQLite pays for one fsync instead of thousands | Background job with progress reporting |
| Seeding | `insert_all` in batches of 1,000; hiring revisions in a single `INSERT ... SELECT` | No per-row callbacks or round trips | Same approach |

## Indexes
`(country_code, job_title)` serves the most common question ("what do we pay role X in country Y?")
and the outlier grouping. There are also indexes on `department`, `job_title`,
`(last_name, first_name)` for sorting, unique indexes on `email` and `employee_code`, and
`(employee_id, created_at)` on salary revisions for the history view.

## Frontend
- Search is debounced (300 ms), so typing doesn't send a request per keystroke.
- `keepPreviousData` keeps the current page on screen while the next one loads, so the table doesn't flicker.
- React Query caches responses (30 s stale time). Writes invalidate only the affected keys: employees, the employee, insights, reference.
- Export is a plain link, so the browser streams the CSV download itself.

## Measured
All numbers are from the development laptop (Windows, development mode, with installs and test
runs going at the same time). That machine needed about 45 s just to boot Rails, so treat these as
upper bounds. A typical Linux server in production mode should be several times faster.

| What | Time |
|------|------|
| Seed 10,000 employees | 35 s (5 s building rows, 30 s SQLite inserts) |
| `GET /api/employees` with search and a filter | 0.7 s |
| `GET /api/insights/countries` | 0.8 s |
| `GET /api/insights/overview` | 1.0 s |
| `GET /api/insights/outliers` | 2.1 s → **1.4 s** after the refactor below |

**Outliers refactor.** The first version loaded all 10,000 employees as ActiveRecord objects just
to compare salaries. It now computes medians and compa-ratios on plucked `(id, group, salary)`
tuples and loads full records only for the ≤100 employees it returns (commit `perf: find pay
outliers on plucked rows`).
