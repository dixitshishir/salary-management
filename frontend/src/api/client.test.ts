import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildQuery, request } from './client'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('buildQuery', () => {
  it('drops empty values so the API only sees real filters', () => {
    expect(buildQuery({ q: '', country_code: 'IN', department: undefined, page: 2 })).toBe('?country_code=IN&page=2')
  })

  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({ q: '' })).toBe('')
  })
})

describe('request', () => {
  it('prefixes /api and parses JSON', async () => {
    const fetchMock = mockFetch(200, { ok: true })

    await expect(request('/reference')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/reference', expect.anything())
  })

  it('turns validation failures into an ApiError carrying field errors', async () => {
    mockFetch(422, { errors: { salary: ['must be greater than 0'] } })

    const error = (await request('/employees', { method: 'POST', body: '{}' }).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toEqual({ salary: ['must be greater than 0'] })
  })

  it('uses the server message when there is one', async () => {
    mockFetch(422, { error: 'percent must be between 0 and 100' })

    await expect(request('/insights/raise_simulation')).rejects.toThrow('percent must be between 0 and 100')
  })
})
