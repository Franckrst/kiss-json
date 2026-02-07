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
