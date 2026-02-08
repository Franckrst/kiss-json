import { memo } from 'react'

type Tab = 'format' | 'compare'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export const Header = memo(function Header({ activeTab, onTabChange, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className={`flex items-center justify-between h-10 px-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}>
      <span className={`font-bold text-sm tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>KISS JSON</span>

      <nav className="flex gap-1">
        {(['format', 'compare'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'format' ? 'Format' : 'Compare'}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/Franckrst/kiss-json"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? '☽ Dark' : '☀ Light'}
        </button>
      </div>
    </header>
  )
})
