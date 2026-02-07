export interface ValidationResult {
  valid: boolean
  error?: {
    message: string
    position?: number
  }
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: { message: 'Empty input' } }
  }
  try {
    JSON.parse(input)
    return { valid: true }
  } catch (e) {
    const message = e instanceof SyntaxError ? e.message : 'Invalid JSON'
    const posMatch = message.match(/at position\s+(\d+)/) || message.match(/position\s+(\d+)/)
    const position = posMatch ? parseInt(posMatch[1], 10) : undefined
    return { valid: false, error: { message, position } }
  }
}
