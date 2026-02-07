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
