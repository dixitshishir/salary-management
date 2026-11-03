import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { insightsApi } from '../api/insights'
import { renderWithProviders } from '../test/render'
import { InsightsPage } from './InsightsPage'

vi.mock('../api/insights', () => ({
  insightsApi: { overview: vi.fn(), countries: vi.fn(), jobTitles: vi.fn() },
}))

const stats = { min: 1_000_000, max: 6_000_000, mean: 3_000_000, median: 2_000_000, p25: 1_500_000, p75: 4_000_000 }

beforeEach(() => {
  vi.mocked(insightsApi.overview).mockResolvedValue({
    headcount: 10_000,
    country_count: 10,
    total_payroll_usd: 812_400_000,
    median_salary_usd: 61_250,
    mean_salary_usd: 81_240,
    rates_as_of: '2026-11-01',
    departments: [{ department: 'Engineering', headcount: 4_000, total_payroll_usd: 400_000_000, median_salary_usd: 90_000 }],
  })
  vi.mocked(insightsApi.countries).mockResolvedValue([
    { country_code: 'IN', country_name: 'India', currency: 'INR', headcount: 3_000, ...stats, mean_usd: 34_091, median_usd: 22_727 },
  ])
  vi.mocked(insightsApi.jobTitles).mockResolvedValue({
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    job_titles: [{ job_title: 'Software Engineer', headcount: 400, ...stats }],
  })
})

describe('InsightsPage', () => {
  it('summarises headcount and payroll across the org', async () => {
    renderWithProviders(<InsightsPage />)

    expect(await screen.findByText('10,000')).toBeInTheDocument()
    expect(screen.getByText('$812.4M')).toBeInTheDocument()
    expect(screen.getByText('$61,250')).toBeInTheDocument()
  })

  it('defaults the job-title table to the largest country', async () => {
    renderWithProviders(<InsightsPage />)

    expect(await screen.findByText('Software Engineer')).toBeInTheDocument()
    expect(insightsApi.jobTitles).toHaveBeenCalledWith('IN')
  })
})
