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
