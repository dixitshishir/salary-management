# How I used AI

I built this project with **Claude Code**, Anthropic's coding agent. It wrote most of the code. My
part was giving it the brief, setting the rules it had to work within, and making the calls along
the way. This page explains how that went, so you can read it next to the commit history.

## The ground rules
The repo has a [`CLAUDE.md`](../CLAUDE.md) file. Claude Code reads it at the start of every
session, so the rules don't have to be repeated in every prompt:
- Write the test first. Tests must be fast, give the same result every run, and never need the network.
- Store salaries as whole numbers in the employee's own currency. Convert to USD only when showing a report.
- Keep business logic in plain Ruby classes (`app/queries`, `app/services`) and keep controllers thin.
- In the frontend, only `src/api` talks to the server.
- Make small commits with Conventional Commit messages.

## How it went
1. **Requirements first.** I pasted the assessment brief into Claude Code. The first thing it
   produced was the one-page requirements doc, before any code. I also asked for a few features
   that weren't in the brief. It suggested four that answer real questions an HR manager has:
   CSV import and export (so they can move off Excel), salary history, pay outlier flags, and a
   raise planner. I told it to go ahead with those. The requirements doc also lists what's
   left out and why.
2. **Setup.** My laptop didn't have Ruby, so I had it install Ruby 3.4 first. I decided not to
   email Incubyte with clarifying questions. The assumptions are written down in
   `requirements.md` instead.
3. **Design.** SQLite and simple page-number pagination are enough for 10,000 rows. SQLite has no
   median function, so medians are worked out in Ruby. [`design-notes.md`](design-notes.md)
   explains these choices and what would change on Postgres.
4. **Backend, test first.** Every unit (salary stats, the employee model, the seed script,
   insights, outliers, the raise planner, CSV) got a failing spec first, then the code to make it
   pass. You can see this in the commit history as `test:` commits followed by `feat:` commits.
5. **Frontend.** React pages on top of the API, with tests for what the user does: search, sort,
   form errors and the raise planner. Validation rules live only in the Rails model. The form
   shows the errors the server sends back, so the rules aren't copied into TypeScript.
6. **Finishing in parallel.** To finish faster, I asked Claude Code to use subagents. Two ran at
   the same time: one finished the backend API and one got the frontend tests passing. Each one
   committed only its own folder, so their work couldn't get mixed up.
7. **Pushing to GitHub.** The first CI run failed. The project was created on Windows, so the
   backend scripts like `bin/rails` weren't marked as executable and pointed at `ruby.exe`, which
   Linux doesn't have. The next commit fixes both, and CI passes now.

## What wasn't right the first time
Not everything came out right first time. The first five were caught while reviewing drafts,
before they were committed. The last two showed up once the app was running with the full 10,000
employees, and were fixed in their own commits:
- **Exchange rates as floats.** `0.76` can't be stored exactly as a float, so totals drift. Rates
  are now read as exact fractions (`Rational`).
- **CSV formula injection.** In Excel, a cell that starts with `=`, `+`, `-` or `@` runs as a
  formula. The export now puts a `'` in front of those cells.
- **Catching too many errors.** The first draft of the raise planner endpoint rescued every
  `ArgumentError`, which would have hidden real bugs. It now rescues only its own
  `RaiseSimulation::InvalidInput`.
- **A confusing import error.** A badly formatted hire date showed up as "Hire date can't be
  blank". It now says the date must be in `YYYY-MM-DD` format.
- **A bad test stub.** A `getComputedStyle` stub would have broken Testing Library's visibility
  checks. It was replaced with the jsdom setup that Mantine recommends.
- **Seed data that wasn't believable.** With the first seed, 1,850 of the 10,000 people showed up
  as pay outliers. No HR manager would trust a list that long. The seed now puts about 3% of
  people off their pay band, the page flags 373, and a test keeps the share between 1% and 8%.
- **A slow outliers page.** It loaded all 10,000 employees as full records just to compare
  salaries. It now works on plain `(id, group, salary)` rows and loads full records only for the
  people it shows. On my laptop that took it from 2.1 s to 1.4 s.

## What I'd keep for myself
- Deciding scope: what goes in, what stays out, and why.
- Judging whether a test really checks the behaviour or just repeats the code.
- Anything involving real salary data or credentials.
- Being able to explain every decision in the code. If I can't explain it, it isn't mine yet.

## If I did it again
- I'd run CI on Linux from the first commit. The Windows script problem would have shown up on
  day one instead of at the end.
- I'd look at the seed data in the real app early. The outlier problem only became obvious once
  the page was showing real numbers.
