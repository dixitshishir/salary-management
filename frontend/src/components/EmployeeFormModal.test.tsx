import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { employeesApi } from '../api/employees'
import { buildEmployee, reference } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { EmployeeFormModal } from './EmployeeFormModal'

vi.mock('../api/employees', () => ({
  employeesApi: { create: vi.fn(), update: vi.fn(), reference: vi.fn() },
}))

const api = vi.mocked(employeesApi)

beforeEach(() => {
  api.reference.mockResolvedValue(reference)
})

const user = userEvent.setup({ delay: null })

describe('EmployeeFormModal', () => {
  it('asks for a reason only once the salary is changed', async () => {
    renderWithProviders(<EmployeeFormModal employee={buildEmployee()} onClose={() => {}} />)
    expect(screen.queryByLabelText('Reason for salary change')).not.toBeInTheDocument()

    const salary = screen.getByLabelText(/Annual salary/)
    await user.clear(salary)
    await user.type(salary, '2000000')

    expect(screen.getByLabelText('Reason for salary change')).toBeInTheDocument()
  })

  it('sends the salary change with its reason', async () => {
    api.update.mockResolvedValue(buildEmployee({ salary: 2_000_000 }))
    const onClose = vi.fn()
    renderWithProviders(<EmployeeFormModal employee={buildEmployee()} onClose={onClose} />)

    const salary = screen.getByLabelText(/Annual salary/)
    await user.clear(salary)
    await user.type(salary, '2000000')
    await user.type(screen.getByLabelText('Reason for salary change'), 'Promotion')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith(1, expect.objectContaining({ salary: 2_000_000, salary_change_reason: 'Promotion' })),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("shows the server's validation errors next to the fields", async () => {
    api.create.mockRejectedValue(
      new ApiError(422, 'Unprocessable', { email: ['has already been taken'], salary: ["can't be blank"] }),
    )
    renderWithProviders(<EmployeeFormModal employee={null} onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(await screen.findByText('has already been taken')).toBeInTheDocument()
    expect(screen.getByText("can't be blank")).toBeInTheDocument()
  })
})
