import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchJsonFromUrl } from '../fetch-json'

describe('fetchJsonFromUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns text content on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"key": "value"}'),
    }))

    const result = await fetchJsonFromUrl('https://example.com/data.json')
    expect(result).toEqual({ ok: true, data: '{"key": "value"}' })
  })

  it('returns error message on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }))

    const result = await fetchJsonFromUrl('https://example.com/missing.json')
    expect(result).toEqual({ ok: false, error: 'HTTP 404: Not Found' })
  })

  it('returns CORS-friendly error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const result = await fetchJsonFromUrl('https://example.com/blocked.json')
    expect(result).toEqual({ ok: false, error: 'Network error (likely CORS). The server does not allow cross-origin requests.' })
  })

  it('returns generic error for other failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Timeout')))

    const result = await fetchJsonFromUrl('https://example.com/slow.json')
    expect(result).toEqual({ ok: false, error: 'Timeout' })
  })
})
