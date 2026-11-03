# Salary Management: Requirements

**Persona:** HR Manager at ACME. **Org size:** ~10,000 employees in 10 countries.

## Goal
Replace the spreadsheets HR uses for salary data with one web app where the HR Manager can
(1) **keep salary records correct**, and (2) **answer "how do we pay people?"** in seconds
without building pivot tables.

## Problems today
- Salary data is spread across Excel files. Edits are manual and easy to get wrong, and nothing records who changed what.
- Simple questions ("What do we pay a Software Engineer in India?") mean filtering and pivoting by hand.
- Comparing pay across countries means converting currencies by hand.

## In scope (MVP)
| # | Feature | Why it matters |
|---|---------|----------------|
| 1 | **Employee directory** with server-side pagination, search (name, email, code), filters (country, department, job title) and sorting | 10k rows are too many to send to the browser or to scroll through |
| 2 | **Add / edit / remove employees** with validation (required fields, positive salary, known country, unique email) | Keeps the data clean at the point of entry, which spreadsheets can't do |
| 3 | **Pay insights by country**: headcount, min, max, average, median | The question HR gets asked most |
| 4 | **Pay insights by job title within a country** | "What do we pay role X in country Y?" |
| 5 | **Org-wide overview**: headcount, total payroll, and pay by department, normalised to USD | Cross-country comparison without hand-converting currencies |
| 6 | **Seed script** creating 10,000 realistic, deterministic employees | Required by the brief; makes the demo and performance realistic |

## Beyond the brief (added on purpose)
| # | Feature | Why it matters |
|---|---------|----------------|
| 7 | **CSV import and export** (export respects the current filters; import reports errors row by row) | Moving off Excel is the main pain point, so HR can bring existing sheets in and take filtered lists out |
| 8 | **Salary revision history**: every salary change is recorded with its old value, new value, reason and timestamp | Audit trail; answers "why is this person paid X?" |
| 9 | **Pay outlier flags**: employees paid >20% above or below the median for their job title in their country (compa-ratio) | Finds possible pay-equity issues before they become problems |
| 10 | **Raise budget simulator**: "what does a 5% raise for Engineering in India cost?" | Helps plan salary-review budgets with no spreadsheet modelling |

## Deliberately left out (and why)
- **Authentication and roles**: there is one persona and the data is synthetic. Before real data goes in, this needs SSO and field-level access (for example, managers see only their own team). Left out to keep the effort on the HR workflows.
- **Payroll processing** (tax, deductions, payslips, bank files): a different product with country-specific legal rules. This app is the system of record for salaries, not a payroll engine.
- **Bonus, equity and benefits**: "salary" here means **annual base salary**. Total compensation is a natural next step.
- **Live exchange rates**: static, dated rates are enough for comparison and keep the numbers reproducible. A real system would pull from a rates feed with effective dates.
- **Org hierarchy and approval workflows**: useful, but not needed to answer pay questions.
- **Gender or diversity pay-gap analysis**: needs sensitive demographic data and a legal and privacy review first. The outlier flags give a first look at pay equity without it.

## Assumptions
- Each employee is paid in their country's currency. Amounts are whole units with no cents, which is how annual salaries are quoted.
- Cross-country figures use USD at fixed rates recorded in one config file.
- Medians are reported alongside averages because averages get skewed by a few very high salaries.

## Success criteria
- The HR Manager can find, add or edit any employee in under 30 seconds.
- Every insight above loads in under 1 second against 10,000 employees.
- Core logic (stats, validation, seeding, simulation) has fast, deterministic unit tests.
