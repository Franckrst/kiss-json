import { describe, it, expect } from 'vitest'
import { validateJson } from '../json-validate'

describe('validateJson', () => {
  it('returns valid for correct JSON', () => {
    const result = validateJson('{"key": "value"}')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns error with message for invalid JSON', () => {
    const result = validateJson('{invalid}')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error!.message).toBeTruthy()
  })

  it('returns error position when available', () => {
    const result = validateJson('{invalid}')
    expect(result.valid).toBe(false)
    expect(result.error!.position).toBeGreaterThan(0)
  })

  it('returns valid for empty array', () => {
    expect(validateJson('[]').valid).toBe(true)
  })

  it('returns invalid for empty string', () => {
    expect(validateJson('').valid).toBe(false)
  })
})
