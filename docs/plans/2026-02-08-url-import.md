# URL Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to import JSON from a URL, with error notifications for CORS or network failures.

**Architecture:** Add a shared `fetchJsonFromUrl` utility function. In FormatView and CompareView, add a URL input popover triggered by a new "URL" button next to the existing "Import" button. On submit, fetch the URL, set the editor content, and show a toast on success or error.

**Tech Stack:** React, fetch API, existing toast system, Tailwind CSS

---

### Task 1: Create fetchJsonFromUrl utility

**Files:**
- Create: `src/utils/fetch-json.ts`
- Create: `src/utils/__tests__/fetch-json.test.ts`

**Step 1: Write the failing test**

```typescript
// src/utils/__tests__/fetch-json.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/fetch-json.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/utils/fetch-json.ts
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/fetch-json.test.ts`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/utils/fetch-json.ts src/utils/__tests__/fetch-json.test.ts
git commit -m "feat: add fetchJsonFromUrl utility with CORS error handling"
```

---

### Task 2: Add URL import to FormatView

**Files:**
- Modify: `src/components/FormatView.tsx`

**Step 1: Add state and handler**

Add to FormatView, after the existing `handleImport` (line 70):

```typescript
const [urlInput, setUrlInput] = useState('')
const [showUrlInput, setShowUrlInput] = useState(false)
const [fetching, setFetching] = useState(false)

const handleFetchUrl = useCallback(async () => {
  if (!urlInput.trim()) return
  setFetching(true)
  const { fetchJsonFromUrl } = await import('../utils/fetch-json')
  const result = await fetchJsonFromUrl(urlInput.trim())
  setFetching(false)
  if (result.ok) {
    setContent(result.data)
    setShowUrlInput(false)
    setUrlInput('')
    showToast('Loaded from URL')
  } else {
    showToast(result.error, 'error')
  }
}, [urlInput, showToast])
```

Add import for `useState` (already imported).

**Step 2: Add URL button and popover to toolbar**

Replace the Import label block (lines 102-108) with:

```tsx
<div className="ml-auto flex items-center gap-1">
  <label className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white cursor-pointer">
    Import
    <input type="file" accept=".json" className="hidden" onChange={e => {
      const file = e.target.files?.[0]
      if (file) handleImport(file)
    }} />
  </label>
  <div className="relative">
    <button
      onClick={() => setShowUrlInput(!showUrlInput)}
      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white"
    >
      URL
    </button>
    {showUrlInput && (
      <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
          placeholder="https://example.com/data.json"
          autoFocus
          className={`w-72 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
        <button
          onClick={handleFetchUrl}
          disabled={fetching}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
        >
          {fetching ? 'Loading...' : 'Fetch'}
        </button>
      </div>
    )}
  </div>
</div>
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/FormatView.tsx
git commit -m "feat: add URL import to FormatView with error notifications"
```

---

### Task 3: Add URL import to CompareView

**Files:**
- Modify: `src/components/CompareView.tsx`

**Step 1: Add state and handler**

Add to CompareView, after the existing `handleFormat` (line 103):

```typescript
const [urlInput, setUrlInput] = useState({ left: '', right: '' })
const [showUrlInput, setShowUrlInput] = useState<'left' | 'right' | null>(null)
const [fetching, setFetching] = useState(false)

const handleFetchUrl = useCallback(async (side: 'left' | 'right') => {
  const url = urlInput[side].trim()
  if (!url) return
  setFetching(true)
  const { fetchJsonFromUrl } = await import('../utils/fetch-json')
  const result = await fetchJsonFromUrl(url)
  setFetching(false)
  if (result.ok) {
    if (side === 'left') setLeftContent(result.data)
    else setRightContent(result.data)
    setShowUrlInput(null)
    setUrlInput(prev => ({ ...prev, [side]: '' }))
    showToast('Loaded from URL')
  } else {
    showToast(result.error, 'error')
  }
}, [urlInput, showToast])
```

**Step 2: Add URL button to left side header**

Replace the left side header actions (lines 141-150) with:

```tsx
<div className="flex gap-1 items-center">
  <button onClick={() => handleFormat('left')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
  <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
    Import
    <input type="file" accept=".json" className="hidden" onChange={e => {
      const file = e.target.files?.[0]
      if (file) handleImport('left')(file)
    }} />
  </label>
  <div className="relative">
    <button
      onClick={() => setShowUrlInput(showUrlInput === 'left' ? null : 'left')}
      className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
    >
      URL
    </button>
    {showUrlInput === 'left' && (
      <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
        <input
          type="url"
          value={urlInput.left}
          onChange={e => setUrlInput(prev => ({ ...prev, left: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleFetchUrl('left')}
          placeholder="https://..."
          autoFocus
          className={`w-56 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
        <button
          onClick={() => handleFetchUrl('left')}
          disabled={fetching}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
        >
          {fetching ? '...' : 'Fetch'}
        </button>
      </div>
    )}
  </div>
</div>
```

**Step 3: Add URL button to right side header**

Apply the same pattern to the right side header (lines 159-168), replacing `'left'` with `'right'` throughout.

```tsx
<div className="flex gap-1 items-center">
  <button onClick={() => handleFormat('right')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
  <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
    Import
    <input type="file" accept=".json" className="hidden" onChange={e => {
      const file = e.target.files?.[0]
      if (file) handleImport('right')(file)
    }} />
  </label>
  <div className="relative">
    <button
      onClick={() => setShowUrlInput(showUrlInput === 'right' ? null : 'right')}
      className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
    >
      URL
    </button>
    {showUrlInput === 'right' && (
      <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
        <input
          type="url"
          value={urlInput.right}
          onChange={e => setUrlInput(prev => ({ ...prev, right: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleFetchUrl('right')}
          placeholder="https://..."
          autoFocus
          className={`w-56 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
        <button
          onClick={() => handleFetchUrl('right')}
          disabled={fetching}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
        >
          {fetching ? '...' : 'Fetch'}
        </button>
      </div>
    )}
  </div>
</div>
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/CompareView.tsx
git commit -m "feat: add URL import to CompareView with error notifications"
```

---

### Task 4: Run all tests and final commit

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All unit tests pass (fetch-json tests + existing tests)

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors
