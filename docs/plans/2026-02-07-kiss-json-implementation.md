# KISS JSON Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build KISS JSON, an open-source web tool for formatting and comparing JSON.

**Architecture:** React SPA with two tabbed views (Format/Compare). CodeMirror 6 editors for JSON input, utility functions for formatting/diffing/filtering, Tailwind CSS for theming. Zero backend.

**Tech Stack:** React 18, TypeScript, Vite, CodeMirror 6, Tailwind CSS v4, Vitest

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

**Step 2: Install Tailwind CSS v4**

Run:
```bash
npm install tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` contents with:
```css
@import "tailwindcss";
```

**Step 3: Install CodeMirror dependencies**

Run:
```bash
npm install codemirror @codemirror/lang-json @codemirror/view @codemirror/state @codemirror/commands @codemirror/language @codemirror/fold
```

**Step 4: Install test and diff dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install diff
```

Add to `vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

**Step 5: Clean up scaffolded files**

- Delete `src/App.css`, `src/assets/`
- Replace `src/App.tsx` with minimal shell:

```tsx
function App() {
  return <div className="min-h-screen bg-gray-900 text-white">KISS JSON</div>
}

export default App
```

**Step 6: Verify everything works**

Run:
```bash
npm run dev
```
Expected: Dev server starts, page shows "KISS JSON" on dark background.

Run:
```bash
npx vitest run
```
Expected: Test suite runs (0 tests, no failures).

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold project with Vite, React, TypeScript, Tailwind, CodeMirror, Vitest"
```

---

### Task 2: JSON Utility Functions (format, minify, sort, validate)

**Files:**
- Create: `src/utils/json-format.ts`
- Create: `src/utils/json-validate.ts`
- Test: `src/utils/__tests__/json-format.test.ts`
- Test: `src/utils/__tests__/json-validate.test.ts`

**Step 1: Write failing tests for json-format**

Create `src/utils/__tests__/json-format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatJson, minifyJson, sortKeys } from '../json-format'

describe('formatJson', () => {
  it('formats minified JSON with 2-space indent', () => {
    const input = '{"b":1,"a":2}'
    const result = formatJson(input, 2)
    expect(result).toBe('{\n  "b": 1,\n  "a": 2\n}')
  })

  it('formats with 4-space indent', () => {
    const input = '{"key":"value"}'
    const result = formatJson(input, 4)
    expect(result).toBe('{\n    "key": "value"\n}')
  })

  it('formats with tab indent', () => {
    const input = '{"key":"value"}'
    const result = formatJson(input, 'tab')
    expect(result).toBe('{\n\t"key": "value"\n}')
  })

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{invalid}')).toThrow()
  })
})

describe('minifyJson', () => {
  it('minifies formatted JSON', () => {
    const input = '{\n  "key": "value"\n}'
    expect(minifyJson(input)).toBe('{"key":"value"}')
  })
})

describe('sortKeys', () => {
  it('sorts keys alphabetically', () => {
    const input = '{"c":3,"a":1,"b":2}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['a', 'b', 'c'])
  })

  it('sorts keys recursively', () => {
    const input = '{"b":{"z":1,"a":2},"a":1}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['a', 'b'])
    expect(Object.keys(parsed.b)).toEqual(['a', 'z'])
  })

  it('handles arrays without sorting them', () => {
    const input = '{"a":[3,1,2]}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(parsed.a).toEqual([3, 1, 2])
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/json-format.test.ts`
Expected: FAIL — module not found

**Step 3: Implement json-format.ts**

Create `src/utils/json-format.ts`:
```ts
export function formatJson(input: string, indent: number | 'tab' = 2): string {
  const parsed = JSON.parse(input)
  const indentValue = indent === 'tab' ? '\t' : indent
  return JSON.stringify(parsed, null, indentValue)
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input))
}

export function sortKeys(input: string, indent: number | 'tab' = 2): string {
  const parsed = JSON.parse(input)
  const sorted = sortKeysRecursive(parsed)
  const indentValue = indent === 'tab' ? '\t' : indent
  return JSON.stringify(sorted, null, indentValue)
}

function sortKeysRecursive(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursive)
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysRecursive((obj as Record<string, unknown>)[key])
    }
    return sorted
  }
  return obj
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/json-format.test.ts`
Expected: All PASS

**Step 5: Write failing tests for json-validate**

Create `src/utils/__tests__/json-validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateJson } from '../json-validate'

describe('validateJson', () => {
  it('returns valid for correct JSON', () => {
    const result = validateJson('{"key": "value"}')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns error with message for invalid JSON', () => {
    const result = validateJson('{invalid}')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error!.message).toBeTruthy()
  })

  it('returns error position when available', () => {
    const result = validateJson('{"key": }')
    expect(result.valid).toBe(false)
    expect(result.error!.position).toBeGreaterThan(0)
  })

  it('returns valid for empty array', () => {
    expect(validateJson('[]').valid).toBe(true)
  })

  it('returns invalid for empty string', () => {
    expect(validateJson('').valid).toBe(false)
  })
})
```

**Step 6: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/json-validate.test.ts`
Expected: FAIL

**Step 7: Implement json-validate.ts**

Create `src/utils/json-validate.ts`:
```ts
export interface ValidationResult {
  valid: boolean
  error?: {
    message: string
    position?: number
  }
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: { message: 'Empty input' } }
  }
  try {
    JSON.parse(input)
    return { valid: true }
  } catch (e) {
    const message = e instanceof SyntaxError ? e.message : 'Invalid JSON'
    const posMatch = message.match(/position\s+(\d+)/)
    const position = posMatch ? parseInt(posMatch[1], 10) : undefined
    return { valid: false, error: { message, position } }
  }
}
```

**Step 8: Run all tests**

Run: `npx vitest run`
Expected: All PASS

**Step 9: Commit**

```bash
git add src/utils/json-format.ts src/utils/json-validate.ts src/utils/__tests__/
git commit -m "feat: add JSON format, minify, sort keys, and validation utilities"
```

---

### Task 3: JSON Path Filter Utility

**Files:**
- Create: `src/utils/json-filter.ts`
- Test: `src/utils/__tests__/json-filter.test.ts`

**Step 1: Write failing tests**

Create `src/utils/__tests__/json-filter.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { filterByPath } from '../json-filter'

describe('filterByPath', () => {
  const data = '{"data":{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}}'

  it('returns full object for empty path', () => {
    const result = filterByPath(data, '')
    expect(JSON.parse(result)).toEqual(JSON.parse(data))
  })

  it('filters by simple key', () => {
    const result = filterByPath(data, '.data')
    expect(JSON.parse(result)).toEqual({ users: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }] })
  })

  it('filters by nested key', () => {
    const result = filterByPath(data, '.data.users')
    expect(JSON.parse(result)).toEqual([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }])
  })

  it('filters by array index', () => {
    const result = filterByPath(data, '.data.users[0]')
    expect(JSON.parse(result)).toEqual({ name: 'Alice', age: 30 })
  })

  it('filters by nested key with array index', () => {
    const result = filterByPath(data, '.data.users[0].name')
    expect(JSON.parse(result)).toBe('Alice')
  })

  it('returns error string for invalid path', () => {
    const result = filterByPath(data, '.nonexistent')
    expect(result).toContain('undefined')
  })

  it('returns error for invalid JSON input', () => {
    expect(() => filterByPath('{bad}', '.key')).toThrow()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/json-filter.test.ts`
Expected: FAIL

**Step 3: Implement json-filter.ts**

Create `src/utils/json-filter.ts`:
```ts
export function filterByPath(jsonString: string, path: string): string {
  const data = JSON.parse(jsonString)

  if (!path || path === '.') {
    return JSON.stringify(data, null, 2)
  }

  const segments = parsePath(path)
  let current: unknown = data

  for (const segment of segments) {
    if (current === null || current === undefined) break
    if (typeof segment === 'number' && Array.isArray(current)) {
      current = current[segment]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment as string]
    } else {
      current = undefined
    }
  }

  return JSON.stringify(current, null, 2)
}

function parsePath(path: string): (string | number)[] {
  const segments: (string | number)[] = []
  const regex = /\.([^.[]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1])
    } else if (match[2] !== undefined) {
      segments.push(parseInt(match[2], 10))
    }
  }

  return segments
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/json-filter.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/utils/json-filter.ts src/utils/__tests__/json-filter.test.ts
git commit -m "feat: add JSON path filter utility with dot-notation support"
```

---

### Task 4: JSON Diff Utility

**Files:**
- Create: `src/utils/json-diff.ts`
- Test: `src/utils/__tests__/json-diff.test.ts`

**Step 1: Write failing tests**

Create `src/utils/__tests__/json-diff.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeJsonDiff, DiffType } from '../json-diff'

describe('computeJsonDiff', () => {
  it('returns empty diff for identical JSON', () => {
    const json = '{"a": 1}'
    const result = computeJsonDiff(json, json)
    expect(result.changes).toHaveLength(0)
    expect(result.totalChanges).toBe(0)
  })

  it('detects added keys', () => {
    const a = '{"a": 1}'
    const b = '{"a": 1, "b": 2}'
    const result = computeJsonDiff(a, b)
    expect(result.changes.some(c => c.type === DiffType.Added && c.path === '.b')).toBe(true)
  })

  it('detects removed keys', () => {
    const a = '{"a": 1, "b": 2}'
    const b = '{"a": 1}'
    const result = computeJsonDiff(a, b)
    expect(result.changes.some(c => c.type === DiffType.Removed && c.path === '.b')).toBe(true)
  })

  it('detects modified values', () => {
    const a = '{"a": 1}'
    const b = '{"a": 2}'
    const result = computeJsonDiff(a, b)
    expect(result.changes.some(c => c.type === DiffType.Modified && c.path === '.a')).toBe(true)
  })

  it('detects nested changes', () => {
    const a = '{"obj": {"x": 1}}'
    const b = '{"obj": {"x": 2}}'
    const result = computeJsonDiff(a, b)
    expect(result.changes.some(c => c.path === '.obj.x')).toBe(true)
  })

  it('detects array changes', () => {
    const a = '{"arr": [1, 2, 3]}'
    const b = '{"arr": [1, 2, 4]}'
    const result = computeJsonDiff(a, b)
    expect(result.changes.some(c => c.path === '.arr[2]')).toBe(true)
  })

  it('counts total changes correctly', () => {
    const a = '{"a": 1, "b": 2}'
    const b = '{"a": 9, "c": 3}'
    const result = computeJsonDiff(a, b)
    expect(result.totalChanges).toBe(3) // modified a, removed b, added c
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/json-diff.test.ts`
Expected: FAIL

**Step 3: Implement json-diff.ts**

Create `src/utils/json-diff.ts`:
```ts
export enum DiffType {
  Added = 'added',
  Removed = 'removed',
  Modified = 'modified',
}

export interface DiffChange {
  type: DiffType
  path: string
  oldValue?: unknown
  newValue?: unknown
}

export interface DiffResult {
  changes: DiffChange[]
  totalChanges: number
}

export function computeJsonDiff(jsonA: string, jsonB: string): DiffResult {
  const a = JSON.parse(jsonA)
  const b = JSON.parse(jsonB)
  const changes: DiffChange[] = []
  compareValues(a, b, '', changes)
  return { changes, totalChanges: changes.length }
}

function compareValues(a: unknown, b: unknown, path: string, changes: DiffChange[]) {
  if (a === b) return

  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    if (a !== b) {
      changes.push({ type: DiffType.Modified, path, oldValue: a, newValue: b })
    }
    return
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`
      if (i >= a.length) {
        changes.push({ type: DiffType.Added, path: itemPath, newValue: b[i] })
      } else if (i >= b.length) {
        changes.push({ type: DiffType.Removed, path: itemPath, oldValue: a[i] })
      } else {
        compareValues(a[i], b[i], itemPath, changes)
      }
    }
    return
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    changes.push({ type: DiffType.Modified, path, oldValue: a, newValue: b })
    return
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)])

  for (const key of allKeys) {
    const keyPath = `${path}.${key}`
    if (!(key in objA)) {
      changes.push({ type: DiffType.Added, path: keyPath, newValue: objB[key] })
    } else if (!(key in objB)) {
      changes.push({ type: DiffType.Removed, path: keyPath, oldValue: objA[key] })
    } else {
      compareValues(objA[key], objB[key], keyPath, changes)
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/json-diff.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/utils/json-diff.ts src/utils/__tests__/json-diff.test.ts
git commit -m "feat: add JSON structural diff utility"
```

---

### Task 5: Theme Hook (dark/light)

**Files:**
- Create: `src/hooks/useTheme.ts`
- Test: `src/hooks/__tests__/useTheme.test.ts`

**Step 1: Write failing test**

Create `src/hooks/__tests__/useTheme.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark', 'light')
  })

  it('defaults to dark theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggles to light theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('kiss-json-theme')).toBe('light')
  })

  it('reads theme from localStorage', () => {
    localStorage.setItem('kiss-json-theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useTheme.test.ts`
Expected: FAIL

**Step 3: Implement useTheme**

Create `src/hooks/useTheme.ts`:
```ts
import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('kiss-json-theme') as Theme | null
    return stored || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('kiss-json-theme', theme)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/__tests__/useTheme.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useTheme hook with dark/light toggle and localStorage persistence"
```

---

### Task 6: Header Component

**Files:**
- Create: `src/components/Header.tsx`
- Test: `src/components/__tests__/Header.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/Header.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Header } from '../Header'

describe('Header', () => {
  const defaultProps = {
    activeTab: 'format' as const,
    onTabChange: vi.fn(),
    theme: 'dark' as const,
    onToggleTheme: vi.fn(),
  }

  it('renders the app name', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('KISS JSON')).toBeInTheDocument()
  })

  it('renders Format and Compare tabs', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('Compare')).toBeInTheDocument()
  })

  it('calls onTabChange when clicking a tab', async () => {
    render(<Header {...defaultProps} />)
    await userEvent.click(screen.getByText('Compare'))
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('compare')
  })

  it('renders GitHub link', () => {
    render(<Header {...defaultProps} />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toBeInTheDocument()
  })
})
```

Also install user-event:
```bash
npm install -D @testing-library/user-event
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/Header.test.tsx`
Expected: FAIL

**Step 3: Implement Header component**

Create `src/components/Header.tsx`:
```tsx
type Tab = 'format' | 'compare'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function Header({ activeTab, onTabChange, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-10 px-4 border-b border-gray-700 bg-gray-900 dark:bg-gray-900 light:bg-white">
      <span className="font-bold text-sm tracking-wide">KISS JSON</span>

      <nav className="flex gap-1">
        {(['format', 'compare'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'format' ? 'Format' : 'Compare'}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/OWNER/kiss-json"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <button
          onClick={onToggleTheme}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/__tests__/Header.test.tsx`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/__tests__/Header.test.tsx
git commit -m "feat: add Header component with tabs, GitHub link, and theme toggle"
```

---

### Task 7: JsonEditor Component (CodeMirror wrapper)

**Files:**
- Create: `src/components/JsonEditor.tsx`

**Step 1: Implement JsonEditor**

Create `src/components/JsonEditor.tsx`:
```tsx
import { useRef, useEffect } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface JsonEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  theme?: 'dark' | 'light'
  placeholder?: string
}

export function JsonEditor({ value, onChange, readOnly = false, theme = 'dark' }: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      json(),
      lineNumbers(),
      foldGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      ...(theme === 'dark' ? [oneDark] : []),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ...(onChange
        ? [EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          })]
        : []),
    ]

    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => view.destroy()
  }, [theme, readOnly]) // Recreate on theme/readOnly change

  // Update content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto border border-gray-700 rounded"
    />
  )
}
```

Note: Install the oneDark theme:
```bash
npm install @codemirror/theme-one-dark
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/JsonEditor.tsx
git commit -m "feat: add JsonEditor component wrapping CodeMirror 6"
```

---

### Task 8: Toast Component

**Files:**
- Create: `src/components/Toast.tsx`
- Create: `src/hooks/useToast.ts`

**Step 1: Implement useToast hook**

Create `src/hooks/useToast.ts`:
```ts
import { useState, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

let nextId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return { toasts, showToast }
}
```

**Step 2: Implement Toast component**

Create `src/components/Toast.tsx`:
```tsx
interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContainerProps {
  toasts: ToastItem[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded shadow-lg text-sm text-white transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Toast.tsx src/hooks/useToast.ts
git commit -m "feat: add Toast component and useToast hook for user feedback"
```

---

### Task 9: FormatView Component

**Files:**
- Create: `src/components/FormatView.tsx`
- Create: `src/components/PathFilter.tsx`

**Step 1: Implement PathFilter**

Create `src/components/PathFilter.tsx`:
```tsx
interface PathFilterProps {
  path: string
  onPathChange: (path: string) => void
  result: string
  error?: string
}

export function PathFilter({ path, onPathChange, result, error }: PathFilterProps) {
  return (
    <div className="flex flex-col h-full border-l border-gray-700">
      <div className="p-2 border-b border-gray-700">
        <input
          type="text"
          value={path}
          onChange={e => onPathChange(e.target.value)}
          placeholder=".data.users[0].name"
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <pre className={`flex-1 p-2 text-sm overflow-auto ${error ? 'text-red-400' : 'text-gray-300'}`}>
        {error || result}
      </pre>
    </div>
  )
}
```

**Step 2: Implement FormatView**

Create `src/components/FormatView.tsx`:
```tsx
import { useState, useMemo, useCallback } from 'react'
import { JsonEditor } from './JsonEditor'
import { PathFilter } from './PathFilter'
import { formatJson, minifyJson, sortKeys } from '../utils/json-format'
import { validateJson } from '../utils/json-validate'
import { filterByPath } from '../utils/json-filter'

interface FormatViewProps {
  theme: 'dark' | 'light'
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function FormatView({ theme, showToast }: FormatViewProps) {
  const [content, setContent] = useState('')
  const [indent, setIndent] = useState<number | 'tab'>(2)
  const [filterPath, setFilterPath] = useState('')

  const validation = useMemo(() => validateJson(content), [content])

  const filterResult = useMemo(() => {
    if (!filterPath || !validation.valid) return { result: '', error: undefined }
    try {
      return { result: filterByPath(content, filterPath), error: undefined }
    } catch {
      return { result: '', error: 'Invalid path or JSON' }
    }
  }, [content, filterPath, validation.valid])

  const handleFormat = useCallback(() => {
    try {
      setContent(formatJson(content, indent))
      showToast('Formatted')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, indent, showToast])

  const handleMinify = useCallback(() => {
    try {
      setContent(minifyJson(content))
      showToast('Minified')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, showToast])

  const handleSort = useCallback(() => {
    try {
      setContent(sortKeys(content, indent))
      showToast('Keys sorted')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, indent, showToast])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      showToast('Copied')
    } catch {
      showToast('Copy failed', 'error')
    }
  }, [content, showToast])

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setContent(text)
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImport(file)
  }, [handleImport])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <button onClick={handleFormat} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white">
          Format
        </button>
        <button onClick={handleMinify} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Minify
        </button>
        <button onClick={handleSort} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Sort Keys
        </button>
        <button onClick={handleCopy} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Copy
        </button>

        <select
          value={String(indent)}
          onChange={e => setIndent(e.target.value === 'tab' ? 'tab' : Number(e.target.value))}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>

        <label className="ml-auto px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white cursor-pointer">
          Import
          <input type="file" accept=".json" className="hidden" onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
          }} />
        </label>

        {/* Validation indicator */}
        {content && (
          <span className={`text-xs ${validation.valid ? 'text-green-400' : 'text-red-400'}`}>
            {validation.valid ? '✓ Valid' : '✗ Invalid'}
          </span>
        )}
      </div>

      {/* Error banner */}
      {!validation.valid && validation.error && content && (
        <div className="px-3 py-1 text-xs bg-red-900/50 text-red-300 border-b border-red-800">
          {validation.error.message}
          {validation.error.position !== undefined && ` (position ${validation.error.position})`}
        </div>
      )}

      {/* Editor + Filter */}
      <div
        className="flex flex-1 overflow-hidden"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className={`${filterPath ? 'w-1/2' : 'w-full'} h-full`}>
          <JsonEditor value={content} onChange={setContent} theme={theme} />
        </div>
        {filterPath || content ? (
          <div className={`${filterPath ? 'w-1/2' : 'hidden'} h-full`}>
            <PathFilter
              path={filterPath}
              onPathChange={setFilterPath}
              result={filterResult.result}
              error={filterResult.error}
            />
          </div>
        ) : null}
      </div>

      {/* Filter input when no filter active */}
      {!filterPath && (
        <div className="px-3 py-2 border-t border-gray-700">
          <input
            type="text"
            value={filterPath}
            onChange={e => setFilterPath(e.target.value)}
            placeholder="Filter: .data.users[0].name"
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  )
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/FormatView.tsx src/components/PathFilter.tsx
git commit -m "feat: add FormatView with toolbar, validation, import, and path filter"
```

---

### Task 10: CompareView Component (Side-by-Side)

**Files:**
- Create: `src/components/CompareView.tsx`

**Step 1: Implement CompareView**

Create `src/components/CompareView.tsx`:
```tsx
import { useState, useMemo, useCallback } from 'react'
import { JsonEditor } from './JsonEditor'
import { computeJsonDiff } from '../utils/json-diff'
import { formatJson } from '../utils/json-format'
import { validateJson } from '../utils/json-validate'

interface CompareViewProps {
  theme: 'dark' | 'light'
  showToast: (msg: string, type?: 'success' | 'error') => void
}

type ViewMode = 'text' | 'tree'

export function CompareView({ theme, showToast }: CompareViewProps) {
  const [leftContent, setLeftContent] = useState('')
  const [rightContent, setRightContent] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('text')

  const leftValid = useMemo(() => validateJson(leftContent), [leftContent])
  const rightValid = useMemo(() => validateJson(rightContent), [rightContent])

  const diffResult = useMemo(() => {
    if (!leftValid.valid || !rightValid.valid) return null
    try {
      return computeJsonDiff(leftContent, rightContent)
    } catch {
      return null
    }
  }, [leftContent, rightContent, leftValid.valid, rightValid.valid])

  const handleSwap = useCallback(() => {
    setLeftContent(prev => {
      setRightContent(leftContent)
      return rightContent
    })
  }, [leftContent, rightContent])

  const handleImport = useCallback((side: 'left' | 'right') => {
    return (file: File) => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        if (side === 'left') setLeftContent(text)
        else setRightContent(text)
      }
      reader.readAsText(file)
    }
  }, [])

  const handleFormat = useCallback((side: 'left' | 'right') => {
    try {
      if (side === 'left') setLeftContent(formatJson(leftContent))
      else setRightContent(formatJson(rightContent))
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [leftContent, rightContent, showToast])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('text')}
            className={`px-2 py-1 text-xs rounded ${viewMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            Text
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-1 text-xs rounded ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            Tree
          </button>
        </div>

        <button onClick={handleSwap} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          ⇄ Swap
        </button>

        {diffResult && (
          <span className="ml-auto text-xs text-gray-400">
            {diffResult.totalChanges} {diffResult.totalChanges === 1 ? 'difference' : 'differences'}
          </span>
        )}
      </div>

      {/* Editors side by side */}
      {viewMode === 'text' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-1/2 border-r border-gray-700">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700 text-xs text-gray-400">
              <span>A — Original</span>
              <div className="flex gap-1">
                <button onClick={() => handleFormat('left')} className="px-1 hover:text-white">Format</button>
                <label className="px-1 hover:text-white cursor-pointer">
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('left')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={leftContent} onChange={setLeftContent} theme={theme} />
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700 text-xs text-gray-400">
              <span>B — Modified</span>
              <div className="flex gap-1">
                <button onClick={() => handleFormat('right')} className="px-1 hover:text-white">Format</button>
                <label className="px-1 hover:text-white cursor-pointer">
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('right')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={rightContent} onChange={setRightContent} theme={theme} />
            </div>
          </div>
        </div>
      ) : (
        <TreeDiffPanel
          leftContent={leftContent}
          rightContent={rightContent}
          diffResult={diffResult}
        />
      )}
    </div>
  )
}

// Inline TreeDiffPanel for the tree view
function TreeDiffPanel({
  leftContent,
  rightContent,
  diffResult,
}: {
  leftContent: string
  rightContent: string
  diffResult: ReturnType<typeof computeJsonDiff> | null
}) {
  if (!diffResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Enter valid JSON on both sides to see the diff tree
      </div>
    )
  }

  if (diffResult.totalChanges === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-green-400 text-sm">
        No differences found
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-1">
        {diffResult.changes.map((change, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 px-2 py-1 rounded text-sm font-mono ${
              change.type === 'added'
                ? 'bg-green-900/30 text-green-300'
                : change.type === 'removed'
                ? 'bg-red-900/30 text-red-300'
                : 'bg-yellow-900/30 text-yellow-300'
            }`}
          >
            <span className="font-bold w-4 text-center">
              {change.type === 'added' ? '+' : change.type === 'removed' ? '−' : '~'}
            </span>
            <span className="text-gray-400">{change.path}</span>
            {change.type === 'modified' && (
              <span>
                <span className="text-red-400 line-through">{JSON.stringify(change.oldValue)}</span>
                {' → '}
                <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
              </span>
            )}
            {change.type === 'added' && (
              <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
            )}
            {change.type === 'removed' && (
              <span className="text-red-400">{JSON.stringify(change.oldValue)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/CompareView.tsx
git commit -m "feat: add CompareView with side-by-side editors and tree diff view"
```

---

### Task 11: App Shell — Wire Everything Together

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Step 1: Update index.css for dark mode base styles**

Replace `src/index.css`:
```css
@import "tailwindcss";

html, body, #root {
  height: 100%;
  margin: 0;
}

.dark {
  color-scheme: dark;
}

.light {
  color-scheme: light;
}
```

**Step 2: Wire App.tsx**

Replace `src/App.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { FormatView } from './components/FormatView'
import { CompareView } from './components/CompareView'
import { ToastContainer } from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

type Tab = 'format' | 'compare'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { toasts, showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('format')

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeTab !== 'format') return
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="format"]')?.click()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="minify"]')?.click()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="sort"]')?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab])

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {activeTab === 'format' ? (
        <FormatView theme={theme} showToast={showToast} />
      ) : (
        <CompareView theme={theme} showToast={showToast} />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
```

**Step 3: Add data-action attributes to FormatView buttons**

Update the Format, Minify, Sort buttons in `src/components/FormatView.tsx` to add `data-action` attributes:
- Format button: `data-action="format"`
- Minify button: `data-action="minify"`
- Sort Keys button: `data-action="sort"`

**Step 4: Run the app and verify manually**

Run: `npm run dev`
Expected: Full app loads with Header, Format tab active, editor visible, theme toggle works, Compare tab switches view.

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/App.tsx src/index.css src/components/FormatView.tsx
git commit -m "feat: wire app shell with header, tabs, keyboard shortcuts, and theme"
```

---

### Task 12: Light Theme Styles

**Files:**
- Modify: `src/index.css`
- Modify: various components for light theme classes

**Step 1: Add light theme styles to components**

Update components to use conditional classes based on theme. The pattern is:
- Dark: `bg-gray-900`, `bg-gray-800`, `border-gray-700`, `text-white`, `text-gray-400`
- Light: `bg-white`, `bg-gray-100`, `border-gray-300`, `text-gray-900`, `text-gray-600`

Pass `theme` prop through components and use ternary expressions for class names.

Key files to update:
- `Header.tsx`: background, text, border colors
- `FormatView.tsx`: toolbar, error banner, filter input colors
- `CompareView.tsx`: toolbar, panel headers, diff colors
- `PathFilter.tsx`: input, text colors
- `Toast.tsx`: already fine (green/red are universal)

**Step 2: Verify both themes visually**

Run: `npm run dev`
Expected: Toggle between dark and light, all elements readable in both modes.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add light theme support across all components"
```

---

### Task 13: Final Polish and Build Verification

**Files:**
- Modify: `public/` (add favicon)
- Modify: `index.html` (title, meta)

**Step 1: Update index.html**

Set title to "KISS JSON" and add meta description:
```html
<title>KISS JSON</title>
<meta name="description" content="Simple JSON formatter and comparator" />
```

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds, output in `dist/`

**Step 4: Preview production build**

Run: `npm run preview`
Expected: App works correctly from production build

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: update metadata and verify production build"
```

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Project scaffolding | 5 min |
| 2 | JSON format/validate utils + tests | 10 min |
| 3 | JSON path filter util + tests | 5 min |
| 4 | JSON diff util + tests | 10 min |
| 5 | useTheme hook + tests | 5 min |
| 6 | Header component + tests | 5 min |
| 7 | JsonEditor (CodeMirror wrapper) | 5 min |
| 8 | Toast component + hook | 3 min |
| 9 | FormatView + PathFilter | 10 min |
| 10 | CompareView + TreeDiffPanel | 10 min |
| 11 | App shell wiring | 5 min |
| 12 | Light theme styles | 5 min |
| 13 | Final polish + build | 5 min |
