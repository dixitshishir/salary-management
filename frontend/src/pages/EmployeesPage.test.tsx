import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { employeesApi } from '../api/employees'
import { buildEmployee, reference } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { EmployeesPage } from './EmployeesPage'

vi.mock('../api/employees', () => ({
  employeesApi: {
    list: vi.fn(),
    reference: vi.fn(),
    get: vi.fn(),
    exportUrl: vi.fn(() => '/api/employees/export'),
  },
}))

const api = vi.mocked(employeesApi)

beforeEach(() => {
  api.reference.mockResolvedValue(reference)
  api.list.mockResolvedValue({
    data: [
      buildEmployee(),
      buildEmployee({ id: 2, employee_code: 'EMP-00002', full_name: 'Liam Smith', country_name: 'United States', currency: 'USD', salary: 120_000, salary_usd: 120_000 }),
    ],
    meta: { page: 1, per_page: 25, total_count: 2, total_pages: 1 },
  })
})

const user = userEvent.setup({ delay: null })

describe('EmployeesPage', () => {
  it('lists employees with salary in local currency and USD', async () => {
    renderWithProviders(<EmployeesPage />)

    const row = (await screen.findByText('Asha Rao')).closest('tr')!
    expect(within(row).getByText('₹1,800,000')).toBeInTheDocument()
    expect(within(row).getByText('≈ $20,455')).toBeInTheDocument()
    expect(screen.getByText('2 employees')).toBeInTheDocument()
  })

  it('does not repeat the USD amount for employees already paid in USD', async () => {
    renderWithProviders(<EmployeesPage />)

    const row = (await screen.findByText('Liam Smith')).closest('tr')!
    expect(within(row).queryByText(/≈/)).not.toBeInTheDocument()
  })

  it('searches on the server once typing pauses', async () => {
    renderWithProviders(<EmployeesPage />)
    await screen.findByText('Asha Rao')

    await user.type(screen.getByRole('textbox', { name: 'Search employees' }), 'asha')

    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'asha', page: 1 })))
  })

  it('sorts by salary, then flips direction on a second click', async () => {
    renderWithProviders(<EmployeesPage />)
    await screen.findByText('Asha Rao')

    await user.click(screen.getByRole('button', { name: 'Annual salary' }))
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'salary', direction: 'asc' })))

    await user.click(screen.getByRole('button', { name: 'Annual salary' }))
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'salary', direction: 'desc' })))
  })

  it('tells the user when nothing matches', async () => {
    api.list.mockResolvedValue({ data: [], meta: { page: 1, per_page: 25, total_count: 0, total_pages: 0 } })

    renderWithProviders(<EmployeesPage />)

    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument()
  })
})
