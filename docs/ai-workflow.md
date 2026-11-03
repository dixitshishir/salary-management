# How AI was used

I built this with **Claude Code** (Anthropic's agentic coding CLI) as a pair programmer. This page
records how I steered it, what it produced, and where its first output needed correcting, so the
commit history can be read alongside it.

## Standing instructions
[`CLAUDE.md`](../CLAUDE.md) is the brief Claude Code reads in every session. It fixes the rules I
cared about most, so I didn't have to repeat them in each prompt:
- test first, with specs that are deterministic and need no network;
- money stored as integers in local currency, converted to USD only when reporting;
- business logic in plain Ruby objects (`app/queries`, `app/services`), with thin controllers;
- the frontend makes HTTP calls only from `src/api`;
- small Conventional Commits.

## Workflow, phase by phase
| Phase | What I asked for | What I checked or changed |
|-------|------------------|---------------------------|
| 1. Requirements | The assessment brief, plus "add a few features beyond the brief" | I chose extras that target the HR Manager's real pain (moving off Excel, explaining pay) rather than generic features, and wrote down what is out of scope and why before any code |
| 2. Design | Data model, API surface, trade-offs | Picked SQLite and offset pagination for 10k rows, with medians in Ruby (SQLite has no `percentile_cont`), and recorded the Postgres path in `design-notes.md` |
| 3. Backend, test first | Specs per unit (stats, model, seeder, insights, outliers, simulator, CSV), then the code to pass them | Each spec was run and seen failing before its implementation went in; see the `test:` → `feat:` commit pairs |
| 4. Frontend | Pages over the API, with tests for behaviour (search, sort, form errors, raise planner) | Validation stays in the Rails model; the form shows the server's field errors instead of copying the rules into TypeScript |
| 5. Parallel finish | Two Claude Code subagents ran at once, one finishing the backend API and one getting the frontend green. Each committed only its own folder, using pathspec commits so their work couldn't mix | Read each agent's report and the diff before relying on it |
| 6. Docs and deploy | README, this file, performance notes, a single Docker image, a Render blueprint | — |

## Where the first AI output needed correcting
Things caught while reviewing drafts, before they were committed:
- **Floating-point exchange rates.** Converting with `Float` rates gives drift (`0.76` is not exact
  in binary). Rates are parsed as `Rational` from their string form.
- **CSV formula injection.** An exported cell starting with `=`, `+`, `-` or `@` runs as a formula in
  Excel. Export now prefixes such cells with `'`.
- **Over-broad error handling.** The first draft of the raise-simulation endpoint rescued every
  `ArgumentError`, which would have hidden real bugs. It now rescues a dedicated
  `RaiseSimulation::InvalidInput`.
- **Unhelpful import errors.** An unparseable hire date showed up as "Hire date can't be blank". It
  now says the expected format, `YYYY-MM-DD`.
- **Test environment stubs.** An over-eager `getComputedStyle` stub would have broken Testing
  Library's visibility checks. Replaced with Mantine's recommended jsdom setup.

## What I would not delegate
- Deciding scope: what is in, what is out, and why.
- Judging whether a test actually pins the behaviour or just mirrors the implementation.
- Anything touching real salary data or credentials.
