import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../AppProviders'
import { makeQueryClient } from '../lib/queryClient'

/** Renders with the real providers and a fresh query cache per test. */
export function renderWithProviders(ui: ReactElement) {
  const client = makeQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: 0 } })
  return render(
    <AppProviders client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProviders>,
  )
}
