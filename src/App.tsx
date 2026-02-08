import { useState, useEffect, lazy, Suspense } from 'react'
import { Header } from './components/Header'
import { ToastContainer } from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

const FormatView = lazy(() => import('./components/FormatView'))
const CompareView = lazy(() => import('./components/CompareView'))

type Tab = 'format' | 'compare'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { toasts, showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('format')
  const [formatContent, setFormatContent] = useState(
    () => localStorage.getItem('kiss-json-content') ?? ''
  )

  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get('url')
    if (!url) return
    let cancelled = false
    import('./utils/fetch-json').then(({ fetchJsonFromUrl }) =>
      fetchJsonFromUrl(url)
    ).then(result => {
      if (cancelled) return
      if (result.ok) {
        setFormatContent(result.data)
        showToast('Loaded from URL')
      } else {
        showToast(result.error, 'error')
      }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('kiss-json-content', formatContent)
    }, 500)
    return () => clearTimeout(timer)
  }, [formatContent])

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
      <div className="relative flex-1 overflow-hidden min-h-0">
        <Suspense fallback={null}>
          {activeTab === 'format' && (
            <div className="absolute inset-0 flex flex-col overflow-hidden">
              <FormatView theme={theme} showToast={showToast} content={formatContent} onContentChange={setFormatContent} />
            </div>
          )}
          {activeTab === 'compare' && (
            <div className="absolute inset-0 flex flex-col overflow-hidden">
              <CompareView theme={theme} showToast={showToast} leftContent={formatContent} onLeftContentChange={setFormatContent} />
            </div>
          )}
        </Suspense>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
