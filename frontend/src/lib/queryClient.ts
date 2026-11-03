import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Salary data changes only through this app, so a short stale time avoids refetch storms.
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    },
  })
}
