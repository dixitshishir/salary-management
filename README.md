# ACME Salary Manager

A web app for ACME's HR Manager to manage salary data for 10,000 employees in 10 countries, and to
answer "how do we pay people?" without spreadsheets.

**Stack:** Ruby on Rails 8 (API) · SQLite · React 19 + TypeScript (Vite) · Mantine UI · TanStack Query
**Tests:** RSpec (backend) · Vitest + Testing Library (frontend)

| | |
|---|---|
| Live demo | https://acme-salary-manager-pcgx.onrender.com (free plan: the first visit after 15 idle minutes takes about a minute to wake up, and demo data resets on each restart) |
| Video walkthrough | _see submission email_ |
| Requirements (one page) | [docs/requirements.md](docs/requirements.md) |
| Design notes and decisions | [docs/design-notes.md](docs/design-notes.md) |
| How AI was used | [docs/ai-workflow.md](docs/ai-workflow.md) and [CLAUDE.md](CLAUDE.md) |
| Performance notes | [docs/performance.md](docs/performance.md) |

## What it does

- **Employee directory**: server-side search, filters, sorting and pagination over 10k rows; add, edit and remove employees with validation.
- **Pay insights**: min, median, mean and max per country (local currency and USD); quartiles per job title within a country; payroll by department.
- **Salary history**: every salary change is logged with old value, new value and reason.
- **Pay outliers**: employees paid more than ±X% from the median for their job title in their country.
- **Raise planner**: the cost of an X% raise for any country, department or job title, without changing data.
- **CSV import and export**: export the filtered list, edit it in Excel, import it back (rows are matched by employee code; errors are reported per line).

## Running locally

Prerequisites: Ruby 3.4, Node 22+.

```bash
# Backend: API on http://localhost:3000
cd backend
bundle install
bin/rails db:setup        # creates the schema and seeds 10,000 employees
bin/rails server
```

```bash
# Frontend: UI on http://localhost:5173 (proxies /api to :3000)
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend && bundle exec rspec
cd frontend && npm test
```

## Deployment

One Docker image holds everything: Vite builds the UI, and Rails serves it and the API
([Dockerfile](Dockerfile)). [render.yaml](render.yaml) deploys it to Render's free plan as a
Blueprint. On first boot the container creates the SQLite database and seeds the 10,000 employees.
The free plan has no persistent disk, so the demo data resets when the service restarts. On a paid
plan, mount a disk and point `DATABASE_PATH` at it.

```bash
docker build -t salary-manager .
docker run -p 3000:3000 -e SECRET_KEY_BASE=$(openssl rand -hex 64) salary-manager
```

## Project layout

```
backend/
  app/models        Employee, SalaryRevision, Country (config-backed)
  app/queries       EmployeeSearch, Pagination, PayInsights, PayOutliers
  app/services      SalaryStats, EmployeeSeeder, RaiseSimulation, EmployeeCsv
  app/controllers   thin JSON controllers under /api
  config/countries.yml   currencies and fixed USD rates
frontend/
  src/api           the only code that makes HTTP calls
  src/pages         Employees, Pay insights, Pay outliers, Raise planner
  src/components    form, drawer, import modal, shared bits
docs/               requirements, design notes, AI workflow
```
