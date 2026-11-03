import { useQuery } from '@tanstack/react-query'
import { employeesApi } from './employees'
import type { Reference } from './types'

export function useReference() {
  return useQuery({ queryKey: ['reference'], queryFn: employeesApi.reference, staleTime: 5 * 60_000 })
}

/** Select options for the filters and forms, built from the reference lists. */
export function referenceOptions(reference: Reference | undefined) {
  return {
    countries: (reference?.countries ?? []).map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` })),
    departments: reference?.departments ?? [],
    jobTitles: reference?.job_titles ?? [],
  }
}
