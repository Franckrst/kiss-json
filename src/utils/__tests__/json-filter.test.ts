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
