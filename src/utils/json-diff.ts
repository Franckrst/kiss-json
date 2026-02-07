export const DiffType = {
  Added: 'added',
  Removed: 'removed',
  Modified: 'modified',
} as const

export type DiffType = (typeof DiffType)[keyof typeof DiffType]

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
