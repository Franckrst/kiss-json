# Web Worker for JSON Operations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deplacer les operations JSON lourdes (format, minify, sort, diff, validate, filter) dans un Web Worker pour ne pas bloquer l'UI sur les gros fichiers.

**Architecture:** Un seul Worker partage qui recoit des messages types (`format`, `minify`, `sort`, `diff`, `validate`, `filter`) et renvoie le resultat. Un hook `useJsonWorker` encapsule la communication Worker et expose des fonctions async. Les composants FormatView et CompareView utilisent ce hook au lieu d'appeler les utils directement.

**Tech Stack:** Web Workers (natif), Vite (gere les workers automatiquement), TypeScript

---

### Task 1: Creer le Worker avec format/minify/sort

**Files:**
- Create: `src/workers/json.worker.ts`

**Step 1: Ecrire le test unitaire pour le worker**

```typescript
// src/workers/__tests__/json.worker.test.ts
import { describe, it, expect } from 'vitest'
import { formatJson, minifyJson, sortKeys } from '../../utils/json-format'

describe('json worker operations', () => {
  const input = '{"b":2,"a":1}'

  it('formats JSON', () => {
    const result = formatJson(input, 2)
    expect(JSON.parse(result)).toEqual({ b: 2, a: 1 })
    expect(result).toContain('\n')
  })

  it('minifies JSON', () => {
    const result = minifyJson('{ "a" : 1 }')
    expect(result).toBe('{"a":1}')
  })

  it('sorts keys', () => {
    const result = sortKeys(input, 2)
    const lines = result.split('\n')
    expect(lines[1]).toContain('"a"')
    expect(lines[2]).toContain('"b"')
  })
})
```

**Step 2: Lancer le test pour verifier qu'il passe**

Run: `npx vitest run src/workers/__tests__/json.worker.test.ts`
Expected: PASS (les utils existent deja)

**Step 3: Creer le Worker**

```typescript
// src/workers/json.worker.ts
import { formatJson, minifyJson, sortKeys } from '../utils/json-format'
import { validateJson } from '../utils/json-validate'
import { filterByPath } from '../utils/json-filter'
import { computeJsonDiff } from '../utils/json-diff'

export type WorkerRequest =
  | { id: number; type: 'format'; content: string; indent: number | 'tab' }
  | { id: number; type: 'minify'; content: string }
  | { id: number; type: 'sort'; content: string; indent: number | 'tab' }
  | { id: number; type: 'validate'; content: string }
  | { id: number; type: 'filter'; content: string; path: string }
  | { id: number; type: 'diff'; leftContent: string; rightContent: string }

export type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string }

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  try {
    let result: unknown
    switch (msg.type) {
      case 'format':
        result = formatJson(msg.content, msg.indent)
        break
      case 'minify':
        result = minifyJson(msg.content)
        break
      case 'sort':
        result = sortKeys(msg.content, msg.indent)
        break
      case 'validate':
        result = validateJson(msg.content)
        break
      case 'filter':
        result = filterByPath(msg.content, msg.path)
        break
      case 'diff':
        result = computeJsonDiff(msg.leftContent, msg.rightContent)
        break
    }
    self.postMessage({ id: msg.id, ok: true, result } satisfies WorkerResponse)
  } catch (err) {
    self.postMessage({ id: msg.id, ok: false, error: err instanceof Error ? err.message : 'Unknown error' } satisfies WorkerResponse)
  }
}
```

**Step 4: Commit**

```bash
git add src/workers/json.worker.ts src/workers/__tests__/json.worker.test.ts
git commit -m "feat: add JSON Web Worker with format, minify, sort, validate, filter, diff"
```

---

### Task 2: Creer le hook useJsonWorker

**Files:**
- Create: `src/hooks/useJsonWorker.ts`

**Step 1: Ecrire le hook**

```typescript
// src/hooks/useJsonWorker.ts
import { useRef, useEffect, useCallback } from 'react'
import type { WorkerRequest, WorkerResponse } from '../workers/json.worker'

type PendingResolve = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
}

let sharedWorker: Worker | null = null
let refCount = 0
const pending = new Map<number, PendingResolve>()
let nextId = 0

function getWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' })
    sharedWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, ...rest } = e.data
      const p = pending.get(id)
      if (!p) return
      pending.delete(id)
      if (rest.ok) {
        p.resolve(rest.result)
      } else {
        p.reject(new Error(rest.error))
      }
    }
  }
  return sharedWorker
}

function sendMessage<T>(msg: Omit<WorkerRequest, 'id'>): Promise<T> {
  const id = nextId++
  const worker = getWorker()
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    worker.postMessage({ ...msg, id })
  })
}

export function useJsonWorker() {
  const mounted = useRef(true)

  useEffect(() => {
    refCount++
    mounted.current = true
    return () => {
      mounted.current = false
      refCount--
      if (refCount === 0 && sharedWorker) {
        sharedWorker.terminate()
        sharedWorker = null
        pending.clear()
      }
    }
  }, [])

  const format = useCallback((content: string, indent: number | 'tab' = 2) =>
    sendMessage<string>({ type: 'format', content, indent }), [])

  const minify = useCallback((content: string) =>
    sendMessage<string>({ type: 'minify', content }), [])

  const sort = useCallback((content: string, indent: number | 'tab' = 2) =>
    sendMessage<string>({ type: 'sort', content, indent }), [])

  const validate = useCallback((content: string) =>
    sendMessage<ReturnType<typeof import('../utils/json-validate').validateJson>>({ type: 'validate', content }), [])

  const filter = useCallback((content: string, path: string) =>
    sendMessage<string>({ type: 'filter', content, path }), [])

  const diff = useCallback((leftContent: string, rightContent: string) =>
    sendMessage<ReturnType<typeof import('../utils/json-diff').computeJsonDiff>>({ type: 'diff', leftContent, rightContent }), [])

  return { format, minify, sort, validate, filter, diff }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useJsonWorker.ts
git commit -m "feat: add useJsonWorker hook for async Worker communication"
```

---

### Task 3: Integrer le Worker dans FormatView

**Files:**
- Modify: `src/components/FormatView.tsx`

**Step 1: Remplacer les appels sync par le Worker**

Dans `FormatView.tsx`, appliquer les changements suivants :

1. Ajouter l'import du hook :
```typescript
import { useJsonWorker } from '../hooks/useJsonWorker'
```

2. Dans le composant, ajouter le hook :
```typescript
const worker = useJsonWorker()
```

3. Remplacer `validation` (useMemo sync) par un state + effect async :
```typescript
const [validation, setValidation] = useState<{ valid: boolean; error?: { message: string; position?: number } }>({ valid: true })

useEffect(() => {
  let cancelled = false
  worker.validate(content).then(result => {
    if (!cancelled) setValidation(result as typeof validation)
  })
  return () => { cancelled = true }
}, [content])
```

4. Remplacer `filterResult` (useMemo sync) par un state + effect async :
```typescript
const [filterResult, setFilterResult] = useState<{ result: string; error?: string }>({ result: '' })

useEffect(() => {
  if (!debouncedFilterPath || !validation.valid) {
    setFilterResult({ result: '' })
    return
  }
  let cancelled = false
  worker.filter(content, debouncedFilterPath).then(result => {
    if (!cancelled) setFilterResult({ result, error: undefined })
  }).catch(() => {
    if (!cancelled) setFilterResult({ result: '', error: 'Invalid path or JSON' })
  })
  return () => { cancelled = true }
}, [content, debouncedFilterPath, validation.valid])
```

5. Remplacer `handleFormat`, `handleMinify`, `handleSort` par des versions async :
```typescript
const handleFormat = useCallback(async () => {
  try {
    const result = await worker.format(content, indent)
    setContent(result)
    showToast('Formatted')
  } catch {
    showToast('Invalid JSON', 'error')
  }
}, [content, indent, showToast])

const handleMinify = useCallback(async () => {
  try {
    const result = await worker.minify(content)
    setContent(result)
    showToast('Minified')
  } catch {
    showToast('Invalid JSON', 'error')
  }
}, [content, showToast])

const handleSort = useCallback(async () => {
  try {
    const result = await worker.sort(content, indent)
    setContent(result)
    showToast('Keys sorted')
  } catch {
    showToast('Invalid JSON', 'error')
  }
}, [content, indent, showToast])
```

6. Supprimer les imports devenus inutiles : `formatJson`, `minifyJson`, `sortKeys` de `json-format`, `validateJson` de `json-validate`, `filterByPath` de `json-filter`.

**Step 2: Lancer les tests e2e**

Run: `npx playwright test e2e/path-filter.spec.ts --project=chromium`
Expected: PASS (le comportement ne change pas, juste async maintenant)

**Step 3: Commit**

```bash
git add src/components/FormatView.tsx
git commit -m "feat: use Web Worker for JSON operations in FormatView"
```

---

### Task 4: Integrer le Worker dans CompareView

**Files:**
- Modify: `src/components/CompareView.tsx`

**Step 1: Remplacer les appels sync par le Worker**

1. Ajouter l'import :
```typescript
import { useJsonWorker } from '../hooks/useJsonWorker'
```

2. Ajouter le hook dans le composant :
```typescript
const worker = useJsonWorker()
```

3. Remplacer `leftValid` et `rightValid` par des states + effects :
```typescript
const [leftValid, setLeftValid] = useState<{ valid: boolean }>({ valid: false })
const [rightValid, setRightValid] = useState<{ valid: boolean }>({ valid: false })

useEffect(() => {
  let cancelled = false
  worker.validate(leftContent).then(result => {
    if (!cancelled) setLeftValid(result as typeof leftValid)
  })
  return () => { cancelled = true }
}, [leftContent])

useEffect(() => {
  let cancelled = false
  worker.validate(rightContent).then(result => {
    if (!cancelled) setRightValid(result as typeof rightValid)
  })
  return () => { cancelled = true }
}, [rightContent])
```

4. Remplacer `diffResult` par un state + effect :
```typescript
const [diffResult, setDiffResult] = useState<DiffResult | null>(null)

useEffect(() => {
  if (!leftValid.valid || !rightValid.valid) {
    setDiffResult(null)
    return
  }
  let cancelled = false
  worker.diff(leftContent, rightContent).then(result => {
    if (!cancelled) setDiffResult(result as DiffResult)
  }).catch(() => {
    if (!cancelled) setDiffResult(null)
  })
  return () => { cancelled = true }
}, [leftContent, rightContent, leftValid.valid, rightValid.valid])
```

5. Remplacer `handleFormat` par une version async :
```typescript
const handleFormat = useCallback(async (side: 'left' | 'right') => {
  try {
    const result = await worker.format(side === 'left' ? leftContent : rightContent)
    if (side === 'left') setLeftContent(result)
    else setRightContent(result)
  } catch {
    showToast('Invalid JSON', 'error')
  }
}, [leftContent, rightContent, showToast])
```

6. Supprimer les imports inutiles : `formatJson` de `json-format`, `validateJson` de `json-validate`, `computeJsonDiff` de `json-diff`.

**Note:** Garder `computeLineDiffs` et l'import de `diffLines` car ils servent au highlighting des lignes et restent sur le thread principal (leger).

**Step 2: Lancer les tests e2e**

Run: `npx playwright test e2e/format-to-compare.spec.ts --project=chromium`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/CompareView.tsx
git commit -m "feat: use Web Worker for JSON operations in CompareView"
```

---

### Task 5: Lancer tous les tests et mettre a jour le README

**Files:**
- Modify: `README.md`

**Step 1: Lancer tous les tests**

Run: `npx vitest run && npx playwright test --project=chromium`
Expected: Tous les tests passent

**Step 2: Ajouter le Worker dans la section Performance du README**

Ajouter dans la section Performance, apres "CSS injection" :

```markdown
- **Web Worker** — All JSON operations (format, minify, sort, validate, filter, diff) run in a dedicated Web Worker thread. The UI never freezes, even on large files.
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add Web Worker to README performance section"
```
