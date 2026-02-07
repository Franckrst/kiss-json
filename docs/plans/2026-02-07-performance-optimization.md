# Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce initial page load time by splitting the 522 KB monolithic JS bundle into lazy-loaded chunks, so only the critical path (~50 KB) loads upfront.

**Architecture:** Use React.lazy + Suspense for tab-based code splitting (FormatView/CompareView). Configure Vite's rollupOptions.manualChunks to isolate codemirror and diff libraries into separate cached chunks. Add React.memo on leaf components to reduce runtime re-renders.

**Tech Stack:** React 19, Vite 7, Rollup manualChunks, React.lazy/Suspense

---

### Task 1: Configure manualChunks in Vite to split vendor bundles

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add rollupOptions with manualChunks**

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'codemirror': [
            'codemirror',
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/lang-json',
            '@codemirror/language',
            '@codemirror/theme-one-dark',
          ],
          'diff': ['diff'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

**Step 2: Build and verify chunks are split**

Run: `npm run build`
Expected: Output shows separate chunks for `react-vendor`, `codemirror`, `diff`, and `index` (app code). Each chunk should be smaller than the previous monolithic 522 KB.

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: split vendor bundles with manualChunks (codemirror, react, diff)"
```

---

### Task 2: Lazy load FormatView and CompareView

**Files:**
- Modify: `src/App.tsx`

**Step 1: Convert static imports to React.lazy**

Replace the static imports:
```ts
import { FormatView } from './components/FormatView'
import { CompareView } from './components/CompareView'
```

With lazy imports and add Suspense:
```ts
import { useState, useEffect, lazy, Suspense } from 'react'
```

Add lazy declarations after the imports:
```ts
const FormatView = lazy(() => import('./components/FormatView').then(m => ({ default: m.FormatView })))
const CompareView = lazy(() => import('./components/CompareView').then(m => ({ default: m.CompareView })))
```

**Step 2: Add default exports to FormatView and CompareView**

At the bottom of `src/components/FormatView.tsx`, add:
```ts
export default FormatView
```

At the bottom of `src/components/CompareView.tsx`, add:
```ts
export default CompareView
```

This allows a simpler lazy import pattern. Update App.tsx to use:
```ts
const FormatView = lazy(() => import('./components/FormatView'))
const CompareView = lazy(() => import('./components/CompareView'))
```

**Step 3: Wrap lazy components in Suspense in App.tsx**

Replace the current tab content rendering (lines 45-52):
```tsx
<div className="relative flex-1 overflow-hidden min-h-0">
  <Suspense fallback={null}>
    <div className={`absolute inset-0 flex flex-col overflow-hidden ${activeTab !== 'format' ? 'invisible pointer-events-none' : ''}`}>
      <FormatView theme={theme} showToast={showToast} content={formatContent} onContentChange={setFormatContent} />
    </div>
    <div className={`absolute inset-0 flex flex-col overflow-hidden ${activeTab !== 'compare' ? 'invisible pointer-events-none' : ''}`}>
      <CompareView theme={theme} showToast={showToast} leftContent={formatContent} onLeftContentChange={setFormatContent} />
    </div>
  </Suspense>
</div>
```

Note: We use `fallback={null}` because the app shell (header) is already rendered and provides visual context. No need for a loading spinner — the views load near-instantly from the separate chunks.

**Step 4: Build and verify code splitting works**

Run: `npm run build`
Expected: Output now shows separate chunks for FormatView and CompareView in addition to the vendor chunks from Task 1. The initial chunk (index) should be much smaller.

**Step 5: Verify the app still works**

Run: `npm run preview`
Expected: App loads correctly. Both Format and Compare tabs work. Switching tabs loads the lazy chunk transparently.

**Step 6: Commit**

```bash
git add src/App.tsx src/components/FormatView.tsx src/components/CompareView.tsx
git commit -m "perf: lazy load FormatView and CompareView with React.lazy"
```

---

### Task 3: Add React.memo to leaf components

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Toast.tsx`
- Modify: `src/components/PathFilter.tsx`
- Modify: `src/components/JsonEditor.tsx`

**Step 1: Memoize Header**

In `src/components/Header.tsx`, wrap with memo:
```ts
import { memo } from 'react'
```

Change:
```ts
export function Header({ ... }: HeaderProps) {
```
To:
```ts
export const Header = memo(function Header({ ... }: HeaderProps) {
  // ... existing body unchanged
})
```

**Step 2: Memoize ToastContainer**

Read `src/components/Toast.tsx` first, then wrap the exported component with `memo` using the same pattern.

**Step 3: Memoize PathFilter**

Read `src/components/PathFilter.tsx` first, then wrap with `memo`.

**Step 4: Memoize JsonEditor**

In `src/components/JsonEditor.tsx`, wrap with memo:
```ts
import { useRef, useEffect, memo } from 'react'
```

Change:
```ts
export function JsonEditor({ ... }: JsonEditorProps) {
```
To:
```ts
export const JsonEditor = memo(function JsonEditor({ ... }: JsonEditorProps) {
  // ... existing body unchanged
})
```

**Step 5: Build and verify no regressions**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 6: Run existing tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/components/Header.tsx src/components/Toast.tsx src/components/PathFilter.tsx src/components/JsonEditor.tsx
git commit -m "perf: add React.memo to leaf components"
```

---

### Task 4: Debounce filter input in FormatView

**Files:**
- Modify: `src/components/FormatView.tsx`

**Step 1: Add debounced filter path state**

In `src/components/FormatView.tsx`, add a debounced version of `filterPath` so the JSON filter computation doesn't fire on every keystroke:

```ts
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
```

After the existing `filterPath` state, add:
```ts
const [debouncedFilterPath, setDebouncedFilterPath] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedFilterPath(filterPath), 200)
  return () => clearTimeout(timer)
}, [filterPath])
```

**Step 2: Use debouncedFilterPath in the useMemo**

Change the `filterResult` memo to use `debouncedFilterPath` instead of `filterPath`:
```ts
const filterResult = useMemo(() => {
  if (!debouncedFilterPath || !validation.valid) return { result: '', error: undefined }
  try {
    return { result: filterByPath(content, debouncedFilterPath), error: undefined }
  } catch {
    return { result: '', error: 'Invalid path or JSON' }
  }
}, [content, debouncedFilterPath, validation.valid])
```

**Step 3: Update the conditional rendering to use `filterPath` (not debounced) for UI responsiveness**

The `{filterPath && (...)}` check in JSX should stay using `filterPath` (not debounced) so the split-pane appears immediately when the user starts typing. Only the computation is debounced.

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/components/FormatView.tsx
git commit -m "perf: debounce filter path input to reduce JSON re-computation"
```

---

### Task 5: Final build verification and size comparison

**Files:** None (verification only)

**Step 1: Build production bundle**

Run: `npm run build`
Expected: Build succeeds with no warnings about chunk sizes exceeding 500 KB.

**Step 2: Document the results**

Note the chunk sizes from the build output. Compare against the baseline:
- Before: 1 chunk at 522.57 KB (168.74 KB gzipped)
- After: Multiple smaller chunks, initial load significantly reduced

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Smoke test with preview**

Run: `npm run preview`
Expected: App loads fast, both tabs work, theme toggle works, format/minify/sort work, compare view works, filter works with debounce.

**Step 5: Commit any remaining changes**

If no changes needed, skip this step.
