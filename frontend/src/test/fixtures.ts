import type { Employee, Reference } from '../api/types'

export const reference: Reference = {
  countries: [
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'US', name: 'United States', currency: 'USD' },
  ],
  departments: ['Engineering', 'Sales'],
  job_titles: ['Software Engineer', 'Account Manager'],
  employment_types: ['full_time', 'part_time', 'contract'],
  rates_as_of: '2026-11-01',
}

export function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    employee_code: 'EMP-00001',
    first_name: 'Asha',
    last_name: 'Rao',
    full_name: 'Asha Rao',
    email: 'asha.rao@acme.test',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    salary: 1_800_000,
    salary_usd: 20_455,
    employment_type: 'full_time',
    hire_date: '2022-04-01',
    ...overrides,
  }
}
