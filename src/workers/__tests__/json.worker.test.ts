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
