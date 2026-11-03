import { buildQuery, request } from './client'
import type {
  Employee,
  EmployeeFilters,
  EmployeeInput,
  EmployeeWithHistory,
  ImportResult,
  Paginated,
  Reference,
} from './types'

export const employeesApi = {
  list: (filters: EmployeeFilters) =>
    request<Paginated<Employee>>(`/employees${buildQuery({ ...filters })}`),

  get: (id: number) => request<EmployeeWithHistory>(`/employees/${id}`),

  create: (input: EmployeeInput) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify({ employee: input }) }),

  update: (id: number, input: Partial<EmployeeInput>) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify({ employee: input }) }),

  remove: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),

  /** A plain link so the browser streams the download itself. */
  exportUrl: (filters: EmployeeFilters) =>
    `/api/employees/export${buildQuery({ q: filters.q, country_code: filters.country_code, department: filters.department, job_title: filters.job_title })}`,

  import: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<ImportResult>('/employees/import', { method: 'POST', body })
  },

  reference: () => request<Reference>('/reference'),
}
