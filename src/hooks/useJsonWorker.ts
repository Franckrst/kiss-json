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
    sendMessage<{ valid: boolean; error?: { message: string; position?: number } }>({ type: 'validate', content }), [])

  const filter = useCallback((content: string, path: string) =>
    sendMessage<string>({ type: 'filter', content, path }), [])

  const diff = useCallback((leftContent: string, rightContent: string) =>
    sendMessage<{ changes: unknown[]; totalChanges: number }>({ type: 'diff', leftContent, rightContent }), [])

  return { format, minify, sort, validate, filter, diff }
}
