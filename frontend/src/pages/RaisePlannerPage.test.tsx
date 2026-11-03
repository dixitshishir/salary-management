import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { employeesApi } from '../api/employees'
import { insightsApi } from '../api/insights'
import { reference } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { RaisePlannerPage } from './RaisePlannerPage'

vi.mock('../api/employees', () => ({ employeesApi: { reference: vi.fn() } }))
vi.mock('../api/insights', () => ({ insightsApi: { simulateRaise: vi.fn() } }))

beforeEach(() => {
  vi.mocked(employeesApi.reference).mockResolvedValue(reference)
})

const user = userEvent.setup({ delay: null })

describe('RaisePlannerPage', () => {
  it('shows the cost of the raise by country', async () => {
    vi.mocked(insightsApi.simulateRaise).mockResolvedValue({
      percent: 5,
      affected_headcount: 1_200,
      current_payroll_usd: 30_000_000,
      raise_cost_usd: 1_500_000,
      new_payroll_usd: 31_500_000,
      by_country: [
        { country_code: 'IN', currency: 'INR', headcount: 1_200, current_payroll: 2_640_000_000, raise_cost: 132_000_000, raise_cost_usd: 1_500_000 },
      ],
    })
    renderWithProviders(<RaisePlannerPage />)

    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    await waitFor(() => expect(insightsApi.simulateRaise).toHaveBeenCalledWith(expect.objectContaining({ percent: 5 })))
    expect(await screen.findByText('Employees affected')).toBeInTheDocument()
    expect(screen.getAllByText('1,200')).toHaveLength(2) // stat card + country row
    expect(screen.getAllByText('$1,500,000')).toHaveLength(2)
    expect(screen.getByText('₹132,000,000')).toBeInTheDocument()
  })

  it('shows the error when the server rejects the input', async () => {
    vi.mocked(insightsApi.simulateRaise).mockRejectedValue(new Error('percent must be between 0 and 100'))
    renderWithProviders(<RaisePlannerPage />)

    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByText('percent must be between 0 and 100')).toBeInTheDocument()
  })
})
