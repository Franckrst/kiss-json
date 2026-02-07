import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { FormatView } from './components/FormatView'
import { CompareView } from './components/CompareView'
import { ToastContainer } from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

type Tab = 'format' | 'compare'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { toasts, showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('format')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeTab !== 'format') return
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="format"]')?.click()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="minify"]')?.click()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-action="sort"]')?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab])

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {activeTab === 'format' ? (
        <FormatView theme={theme} showToast={showToast} />
      ) : (
        <CompareView theme={theme} showToast={showToast} />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
