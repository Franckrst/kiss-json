type FetchResult =
  | { ok: true; data: string }
  | { ok: false; error: string }

export async function fetchJsonFromUrl(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    const data = await response.text()
    return { ok: true, data }
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      return { ok: false, error: 'Network error (likely CORS). The server does not allow cross-origin requests.' }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
