// Shapes returned by the Rails API (see backend/app/serializers and app/queries).

export type EmploymentType = 'full_time' | 'part_time' | 'contract'

export interface EmployeeSummary {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  job_title: string
  department: string
  country_code: string
  country_name: string
  currency: string
  salary: number
  salary_usd: number
}

export interface Employee extends EmployeeSummary {
  email: string
  employment_type: EmploymentType
  hire_date: string
}

export interface SalaryRevision {
  id: number
  previous_salary: number | null
  new_salary: number
  reason: string | null
  created_at: string
}

export interface EmployeeWithHistory extends Employee {
  salary_revisions: SalaryRevision[]
}

export interface EmployeeInput {
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  salary: number | ''
  employment_type: EmploymentType
  hire_date: string
  salary_change_reason?: string
}

export interface PageMeta {
  page: number
  per_page: number
  total_count: number
  total_pages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface EmployeeFilters {
  q?: string
  country_code?: string
  department?: string
  job_title?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface Reference {
  countries: { code: string; name: string; currency: string }[]
  departments: string[]
  job_titles: string[]
  employment_types: EmploymentType[]
  rates_as_of: string
}

export interface Stats {
  min: number
  max: number
  mean: number
  median: number
  p25: number
  p75: number
}

export interface CountryInsight extends Stats {
  country_code: string
  country_name: string
  currency: string
  headcount: number
  mean_usd: number
  median_usd: number
}

export interface JobTitleInsight extends Stats {
  job_title: string
  headcount: number
}

export interface JobTitleInsights {
  country_code: string
  country_name: string
  currency: string
  job_titles: JobTitleInsight[]
}

export interface Overview {
  headcount: number
  country_count: number
  total_payroll_usd: number
  median_salary_usd: number
  mean_salary_usd: number
  rates_as_of: string
  departments: { department: string; headcount: number; total_payroll_usd: number; median_salary_usd: number }[]
}

export interface Outlier {
  employee: EmployeeSummary
  peer_median: number
  peer_count: number
  compa_ratio: number
  direction: 'above' | 'below'
}

export interface OutlierReport {
  threshold: number
  total_count: number
  outliers: Outlier[]
}

export interface RaiseSimulationInput {
  percent: number
  country_code?: string
  department?: string
  job_title?: string
}

export interface RaiseSimulationResult {
  percent: number
  affected_headcount: number
  current_payroll_usd: number
  raise_cost_usd: number
  new_payroll_usd: number
  by_country: {
    country_code: string
    currency: string
    headcount: number
    current_payroll: number
    raise_cost: number
    raise_cost_usd: number
  }[]
}

export interface ImportResult {
  created: number
  updated: number
  unchanged: number
  errors: { line: number; employee_code: string | null; messages: string[] }[]
}
