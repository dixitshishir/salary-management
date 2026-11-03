# Instructions for AI coding agents (Claude Code)

This file is the standing brief I give Claude Code in this repo. It is committed so reviewers
can see how the AI was steered, not only what it produced.

## Product context
- Persona: HR Manager at ACME (~10,000 employees, 10 countries).
- Source of truth for scope: `docs/requirements.md`. Do not add features that are not listed there;
  propose them first.

## Architecture
- `backend/`: Rails API (`/api/*` JSON). Business logic lives in plain Ruby objects under
  `app/services` and `app/queries`, not in controllers. Controllers parse params and render.
- `frontend/`: React + TypeScript (Vite). All HTTP calls go through `src/api/`. Components never
  call `fetch` directly.
- In production, Rails serves the built frontend from `public/`, so there is one deployable unit.

## Rules
- **Test first.** Write a failing spec, make it pass, then refactor. Each commit should leave the
  suite green.
- Tests must be fast and deterministic: no network, no sleeps, seeded randomness, fixed dates.
- Money is an **integer number of whole units** in the employee's local currency. Never use floats
  for stored salaries. Convert to USD only for reporting, via `config/countries.yml`.
- Heavy aggregation belongs in SQL (`GROUP BY`). Pull values into Ruby only where SQLite has no
  equivalent (median, percentiles), and say so in a comment.
- Small, focused commits with Conventional Commit messages (`feat:`, `test:`, `refactor:`,
  `docs:`, `chore:`).
- No secrets in the repo.

## Commands
- Backend tests: `cd backend && bundle exec rspec`
- Frontend tests: `cd frontend && npm test`
- Seed 10k employees: `cd backend && bin/rails db:seed`
