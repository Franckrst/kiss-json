import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark', 'light')
  })

  it('defaults to dark theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggles to light theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('kiss-json-theme')).toBe('light')
  })

  it('reads theme from localStorage', () => {
    localStorage.setItem('kiss-json-theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })
})
