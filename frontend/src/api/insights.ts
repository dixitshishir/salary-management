import { buildQuery, request } from './client'
import type {
  CountryInsight,
  JobTitleInsights,
  OutlierReport,
  Overview,
  RaiseSimulationInput,
  RaiseSimulationResult,
} from './types'

export const insightsApi = {
  overview: () => request<Overview>('/insights/overview'),

  countries: () => request<CountryInsight[]>('/insights/countries'),

  jobTitles: (countryCode: string) =>
    request<JobTitleInsights>(`/insights/job_titles${buildQuery({ country_code: countryCode })}`),

  outliers: (params: { threshold: number; country_code?: string }) =>
    request<OutlierReport>(`/insights/outliers${buildQuery(params)}`),

  simulateRaise: (input: RaiseSimulationInput) =>
    request<RaiseSimulationResult>('/insights/raise_simulation', { method: 'POST', body: JSON.stringify(input) }),
}
