import { describe, it, expect } from 'vitest'
import { formatJson, minifyJson, sortKeys } from '../json-format'

describe('formatJson', () => {
  it('formats minified JSON with 2-space indent', () => {
    const input = '{"b":1,"a":2}'
    const result = formatJson(input, 2)
    expect(result).toBe('{\n  "b": 1,\n  "a": 2\n}')
  })

  it('formats with 4-space indent', () => {
    const input = '{"key":"value"}'
    const result = formatJson(input, 4)
    expect(result).toBe('{\n    "key": "value"\n}')
  })

  it('formats with tab indent', () => {
    const input = '{"key":"value"}'
    const result = formatJson(input, 'tab')
    expect(result).toBe('{\n\t"key": "value"\n}')
  })

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{invalid}')).toThrow()
  })
})

describe('minifyJson', () => {
  it('minifies formatted JSON', () => {
    const input = '{\n  "key": "value"\n}'
    expect(minifyJson(input)).toBe('{"key":"value"}')
  })
})

describe('sortKeys', () => {
  it('sorts keys alphabetically', () => {
    const input = '{"c":3,"a":1,"b":2}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['a', 'b', 'c'])
  })

  it('sorts keys recursively', () => {
    const input = '{"b":{"z":1,"a":2},"a":1}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(Object.keys(parsed)).toEqual(['a', 'b'])
    expect(Object.keys(parsed.b)).toEqual(['a', 'z'])
  })

  it('handles arrays without sorting them', () => {
    const input = '{"a":[3,1,2]}'
    const result = sortKeys(input)
    const parsed = JSON.parse(result)
    expect(parsed.a).toEqual([3, 1, 2])
  })
})
