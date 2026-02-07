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

  const result = JSON.stringify(current, null, 2)
  return result !== undefined ? result : 'undefined'
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
