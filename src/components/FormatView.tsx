import { useState, useCallback, useEffect } from 'react'
import { JsonEditor } from './JsonEditor'
import { PathFilter } from './PathFilter'
import { useJsonWorker } from '../hooks/useJsonWorker'

interface FormatViewProps {
  theme: 'dark' | 'light'
  showToast: (msg: string, type?: 'success' | 'error') => void
  content: string
  onContentChange: (value: string) => void
}

function FormatView({ theme, showToast, content, onContentChange: setContent }: FormatViewProps) {
  const worker = useJsonWorker()
  const [indent, setIndent] = useState<number | 'tab'>(2)
  const [filterPath, setFilterPath] = useState('')
  const [debouncedFilterPath, setDebouncedFilterPath] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilterPath(filterPath), 200)
    return () => clearTimeout(timer)
  }, [filterPath])

  const [validation, setValidation] = useState<{ valid: boolean; error?: { message: string; position?: number } }>({ valid: true })

  useEffect(() => {
    let cancelled = false
    worker.validate(content).then(result => {
      if (!cancelled) setValidation(result)
    })
    return () => { cancelled = true }
  }, [content])

  const [filterResult, setFilterResult] = useState<{ result: string; error?: string }>({ result: '' })

  useEffect(() => {
    if (!debouncedFilterPath || !validation.valid) {
      setFilterResult({ result: '' })
      return
    }
    let cancelled = false
    worker.filter(content, debouncedFilterPath).then(result => {
      if (!cancelled) setFilterResult({ result, error: undefined })
    }).catch(() => {
      if (!cancelled) setFilterResult({ result: '', error: 'Invalid path or JSON' })
    })
    return () => { cancelled = true }
  }, [content, debouncedFilterPath, validation.valid])

  const handleFormat = useCallback(async () => {
    try {
      const result = await worker.format(content, indent)
      setContent(result)
      showToast('Formatted')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, indent, showToast])

  const handleMinify = useCallback(async () => {
    try {
      const result = await worker.minify(content)
      setContent(result)
      showToast('Minified')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, showToast])

  const handleSort = useCallback(async () => {
    try {
      const result = await worker.sort(content, indent)
      setContent(result)
      showToast('Keys sorted')
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [content, indent, showToast])

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setContent(text)
    }
    reader.readAsText(file)
  }, [])

  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [fetching, setFetching] = useState(false)

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return
    setFetching(true)
    const { fetchJsonFromUrl } = await import('../utils/fetch-json')
    const result = await fetchJsonFromUrl(urlInput.trim())
    setFetching(false)
    if (result.ok) {
      setContent(result.data)
      setShowUrlInput(false)
      setUrlInput('')
      showToast('Loaded from URL')
    } else {
      showToast(result.error, 'error')
    }
  }, [urlInput, showToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImport(file)
  }, [handleImport])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <button data-action="format" onClick={handleFormat} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white">
          Format
        </button>
        <button data-action="minify" onClick={handleMinify} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Minify
        </button>
        <button data-action="sort" onClick={handleSort} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Sort Keys
        </button>
        <select
          value={String(indent)}
          onChange={e => setIndent(e.target.value === 'tab' ? 'tab' : Number(e.target.value))}
          aria-label="Indentation"
          className={`px-2 py-1 text-xs border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        >
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>

        <div className="ml-auto flex items-center gap-1">
          <label className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white cursor-pointer">
            Import
            <input type="file" accept=".json" className="hidden" onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
            }} />
          </label>
          <div className="relative">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white"
            >
              URL
            </button>
            {showUrlInput && (
              <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                  placeholder="https://example.com/data.json"
                  autoFocus
                  className={`w-72 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={fetching}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
                >
                  {fetching ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            )}
          </div>
        </div>

        {content && (
          <span className={`text-xs ${validation.valid ? 'text-green-400' : 'text-red-400'}`}>
            {validation.valid ? 'Valid' : 'Invalid'}
          </span>
        )}
      </div>

      {/* Error banner */}
      {!validation.valid && validation.error && content && (
        <div className={`px-3 py-1 text-xs border-b ${theme === 'dark' ? 'bg-red-900/50 text-red-300 border-red-800' : 'bg-red-50 text-red-700 border-red-300'}`}>
          {validation.error.message}
          {validation.error.position !== undefined && ` (position ${validation.error.position})`}
        </div>
      )}

      {/* Editor + Filter */}
      <div
        className="flex flex-1 overflow-hidden"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className={`${filterPath ? 'w-1/2' : 'w-full'} h-full`}>
          <JsonEditor value={content} onChange={setContent} theme={theme} ariaLabel="JSON editor" />
        </div>
        {filterPath && (
          <div className="w-1/2 h-full">
            <PathFilter
              path={filterPath}
              onPathChange={setFilterPath}
              result={filterResult.result}
              error={filterResult.error}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* Filter input at bottom */}
      <div className={`px-3 py-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <input
          type="text"
          value={filterPath}
          onChange={e => setFilterPath(e.target.value)}
          placeholder="Filter: .data.users[0].name"
          className={`w-full px-2 py-1 text-sm border rounded placeholder-gray-500 focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
      </div>
    </div>
  )
}

export { FormatView }
export default FormatView
