# Design notes (written before coding, updated as things changed)

## Shape of the system

```
Browser (React + Mantine)
   │  JSON over /api
   ▼
Rails API ── controllers (params in, JSON out)
   │          ├── queries/   read-side: filtering, pagination, insights
   │          └── services/  write-side: CSV import, raise simulation, seeding
   ▼
SQLite (one file)  +  config/countries.yml (currency and USD rate per country)
```

There is one deployable unit: in production, Rails also serves the built React app from `public/`.

## Data model

**employees**
| column | type | notes |
|--------|------|-------|
| employee_code | string, unique | `EMP-00001`, the human-facing id HR already uses |
| first_name, last_name | string | |
| email | string, unique (case-insensitive) | |
| job_title | string, indexed | |
| department | string, indexed | |
| country_code | string(2), indexed | ISO 3166 alpha-2; must exist in `countries.yml` |
| salary | integer | annual base salary, whole units of the country's currency |
| employment_type | string | `full_time`, `part_time`, `contract` |
| hire_date | date | cannot be in the future |

Composite index on `(country_code, job_title)` because "role X in country Y" is the hottest query.

**salary_revisions**: `employee_id`, `previous_salary` (null on hire), `new_salary`, `reason`, `created_at`.
Written by the model whenever `salary` changes, in the same transaction, so normal edits can't
skip the audit trail.

Currency is **derived from the country** instead of being stored per employee. Storing both would
allow an "India employee paid in GBP" mismatch that the brief gives no reason to support.

## API

| Method & path | Purpose |
|---------------|---------|
| `GET /api/employees` | list; `q`, `country_code`, `department`, `job_title`, `sort`, `direction`, `page`, `per_page` |
| `GET /api/employees/:id` | detail, including salary revisions |
| `POST /api/employees` · `PATCH /api/employees/:id` · `DELETE /api/employees/:id` | CRUD |
| `GET /api/employees/export` | CSV, same filters as the list |
| `POST /api/employees/import` | CSV upload; returns created count and per-row errors |
| `GET /api/reference` | countries (with currency), departments, job titles, employment types for forms and filters |
| `GET /api/insights/overview` | headcount, total payroll in USD, median USD, by department |
| `GET /api/insights/countries` | per country: headcount, min, max, mean, median (local currency and USD) |
| `GET /api/insights/job_titles?country_code=IN` | the same stats per job title within one country |
| `GET /api/insights/outliers?country_code=&threshold=0.2` | employees whose compa-ratio is outside 1 ± threshold |
| `POST /api/insights/raise_simulation` | `{percent, country_code?, department?, job_title?}` → affected headcount and cost |

## Key decisions
1. **SQLite.** Zero setup for reviewers, and fast enough for 10k rows. Postgres would be the move
   for concurrent writers or percentile functions in SQL. The schema uses nothing SQLite-specific.
2. **Offset pagination.** At 10k rows, `LIMIT/OFFSET` with indexed filters costs a few
   milliseconds. Keyset pagination would only matter at millions of rows.
3. **Medians computed in Ruby.** SQLite has no `percentile_cont`. Per-group salaries are plucked
   as integers (10k ints is about 80 KB) and sorted in memory. On Postgres this moves into SQL.
4. **Stats in a pure Ruby object** (`SalaryStats`), so the maths is unit-tested without the database.
5. **Deterministic seed.** One seeded `Random` drives everything, so a given seed always produces
   the same 10k employees. Bulk `insert_all` in batches keeps seeding to seconds.
6. **USD normalisation only on read.** Stored data stays in local currency, which is what HR enters
   and what employees are paid. Rates live in one versioned config file with an `as_of` date.
