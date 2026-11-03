import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { employeesApi } from '../api/employees'
import { insightsApi } from '../api/insights'
import { buildEmployee, reference } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { OutliersPage } from './OutliersPage'

vi.mock('../api/employees', () => ({ employeesApi: { reference: vi.fn() } }))
vi.mock('../api/insights', () => ({ insightsApi: { outliers: vi.fn() } }))

beforeEach(() => {
  vi.mocked(employeesApi.reference).mockResolvedValue(reference)
  vi.mocked(insightsApi.outliers).mockResolvedValue({
    threshold: 0.2,
    total_count: 2,
    outliers: [
      { employee: buildEmployee({ id: 1, full_name: 'Asha Rao', salary: 700_000 }), peer_median: 1_000_000, peer_count: 5, compa_ratio: 0.7, direction: 'below' },
      { employee: buildEmployee({ id: 2, full_name: 'Liam Smith', salary: 1_500_000 }), peer_median: 1_000_000, peer_count: 5, compa_ratio: 1.5, direction: 'above' },
    ],
  })
})

describe('OutliersPage', () => {
  it('shows each flagged employee with their gap from the peer median', async () => {
    renderWithProviders(<OutliersPage />)

    const below = (await screen.findByText('Asha Rao')).closest('tr')!
    expect(within(below).getByText('-30% below')).toBeInTheDocument()
    expect(within(below).getByText('₹1,000,000')).toBeInTheDocument()

    const above = screen.getByText('Liam Smith').closest('tr')!
    expect(within(above).getByText('+50% above')).toBeInTheDocument()
  })

  it('asks the API with the default ±20% threshold', async () => {
    renderWithProviders(<OutliersPage />)
    await screen.findByText('Asha Rao')

    expect(insightsApi.outliers).toHaveBeenCalledWith({ threshold: 0.2, country_code: undefined })
  })
})
