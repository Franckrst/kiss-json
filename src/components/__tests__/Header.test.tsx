import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Header } from '../Header'

describe('Header', () => {
  const defaultProps = {
    activeTab: 'format' as const,
    onTabChange: vi.fn(),
    theme: 'dark' as const,
    onToggleTheme: vi.fn(),
  }

  it('renders the app name', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('KISS JSON')).toBeInTheDocument()
  })

  it('renders Format and Compare tabs', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('Compare')).toBeInTheDocument()
  })

  it('calls onTabChange when clicking a tab', async () => {
    render(<Header {...defaultProps} />)
    await userEvent.click(screen.getByText('Compare'))
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('compare')
  })

  it('renders GitHub link', () => {
    render(<Header {...defaultProps} />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toBeInTheDocument()
  })
})
