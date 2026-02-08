import { useState, useMemo, useCallback, useEffect } from 'react'
import { diffLines } from 'diff'
import { JsonEditor } from './JsonEditor'
import type { DiffResult } from '../utils/json-diff'
import { useJsonWorker } from '../hooks/useJsonWorker'

interface CompareViewProps {
  theme: 'dark' | 'light'
  showToast: (msg: string, type?: 'success' | 'error') => void
  leftContent: string
  onLeftContentChange: (value: string) => void
}

type ViewMode = 'text' | 'tree'

function countLines(value: string): number {
  if (!value) return 0
  const parts = value.split('\n')
  return value.endsWith('\n') ? parts.length - 1 : parts.length
}

function computeLineDiffs(left: string, right: string) {
  const leftLines = new Map<number, string>()
  const rightLines = new Map<number, string>()

  if (!left && !right) return { leftLines, rightLines }

  const changes = diffLines(left, right)
  let leftLine = 1
  let rightLine = 1

  for (const change of changes) {
    const count = countLines(change.value)
    if (count === 0) continue

    if (change.added) {
      for (let i = 0; i < count; i++) {
        rightLines.set(rightLine + i, 'cm-diff-added')
      }
      rightLine += count
    } else if (change.removed) {
      for (let i = 0; i < count; i++) {
        leftLines.set(leftLine + i, 'cm-diff-removed')
      }
      leftLine += count
    } else {
      leftLine += count
      rightLine += count
    }
  }

  return { leftLines, rightLines }
}

function CompareView({ theme, showToast, leftContent, onLeftContentChange: setLeftContent }: CompareViewProps) {
  const [rightContent, setRightContent] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('text')
  const worker = useJsonWorker()

  const [leftValid, setLeftValid] = useState<{ valid: boolean }>({ valid: false })
  const [rightValid, setRightValid] = useState<{ valid: boolean }>({ valid: false })

  useEffect(() => {
    let cancelled = false
    worker.validate(leftContent).then(result => {
      if (!cancelled) setLeftValid(result)
    })
    return () => { cancelled = true }
  }, [leftContent])

  useEffect(() => {
    let cancelled = false
    worker.validate(rightContent).then(result => {
      if (!cancelled) setRightValid(result)
    })
    return () => { cancelled = true }
  }, [rightContent])

  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)

  useEffect(() => {
    if (!leftValid.valid || !rightValid.valid) {
      setDiffResult(null)
      return
    }
    let cancelled = false
    worker.diff(leftContent, rightContent).then(result => {
      if (!cancelled) setDiffResult(result as DiffResult)
    }).catch(() => {
      if (!cancelled) setDiffResult(null)
    })
    return () => { cancelled = true }
  }, [leftContent, rightContent, leftValid.valid, rightValid.valid])

  const lineDiffs = useMemo(
    () => computeLineDiffs(leftContent, rightContent),
    [leftContent, rightContent]
  )

  const handleSwap = useCallback(() => {
    const temp = leftContent
    setLeftContent(rightContent)
    setRightContent(temp)
  }, [leftContent, rightContent])

  const handleImport = useCallback((side: 'left' | 'right') => {
    return (file: File) => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        if (side === 'left') setLeftContent(text)
        else setRightContent(text)
      }
      reader.readAsText(file)
    }
  }, [])

  const [urlInput, setUrlInput] = useState({ left: '', right: '' })
  const [showUrlInput, setShowUrlInput] = useState<'left' | 'right' | null>(null)
  const [fetching, setFetching] = useState(false)

  const handleFetchUrl = useCallback(async (side: 'left' | 'right') => {
    const url = urlInput[side].trim()
    if (!url) return
    setFetching(true)
    const { fetchJsonFromUrl } = await import('../utils/fetch-json')
    const result = await fetchJsonFromUrl(url)
    setFetching(false)
    if (result.ok) {
      if (side === 'left') setLeftContent(result.data)
      else setRightContent(result.data)
      setShowUrlInput(null)
      setUrlInput(prev => ({ ...prev, [side]: '' }))
      showToast('Loaded from URL')
    } else {
      showToast(result.error, 'error')
    }
  }, [urlInput, showToast])

  const handleFormat = useCallback(async (side: 'left' | 'right') => {
    try {
      const result = await worker.format(side === 'left' ? leftContent : rightContent)
      if (side === 'left') setLeftContent(result)
      else setRightContent(result)
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [leftContent, rightContent, showToast])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('text')}
            className={`px-2 py-1 text-xs rounded ${viewMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            Text
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-1 text-xs rounded ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            Tree
          </button>
        </div>

        <button onClick={handleSwap} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">
          Swap
        </button>

        {diffResult && (
          <span className={`ml-auto text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {diffResult.totalChanges} {diffResult.totalChanges === 1 ? 'difference' : 'differences'}
          </span>
        )}
      </div>

      {/* Editors side by side */}
      {viewMode === 'text' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className={`flex flex-col w-1/2 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
            <div className={`flex items-center justify-between px-2 py-1 border-b text-xs ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
              <span>A - Original</span>
              <div className="flex gap-1 items-center">
                <button onClick={() => handleFormat('left')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
                <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('left')(file)
                  }} />
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowUrlInput(showUrlInput === 'left' ? null : 'left')}
                    className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                  >
                    URL
                  </button>
                  {showUrlInput === 'left' && (
                    <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <input
                        type="url"
                        value={urlInput.left}
                        onChange={e => setUrlInput(prev => ({ ...prev, left: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleFetchUrl('left')}
                        placeholder="https://..."
                        autoFocus
                        className={`w-56 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      />
                      <button
                        onClick={() => handleFetchUrl('left')}
                        disabled={fetching}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
                      >
                        {fetching ? '...' : 'Fetch'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={leftContent} onChange={setLeftContent} theme={theme} lineClasses={lineDiffs.leftLines} ariaLabel="Original JSON editor" />
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className={`flex items-center justify-between px-2 py-1 border-b text-xs ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
              <span>B - Modified</span>
              <div className="flex gap-1 items-center">
                <button onClick={() => handleFormat('right')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
                <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('right')(file)
                  }} />
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowUrlInput(showUrlInput === 'right' ? null : 'right')}
                    className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                  >
                    URL
                  </button>
                  {showUrlInput === 'right' && (
                    <div className={`absolute right-0 top-full mt-1 flex gap-1 p-2 rounded border shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <input
                        type="url"
                        value={urlInput.right}
                        onChange={e => setUrlInput(prev => ({ ...prev, right: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleFetchUrl('right')}
                        placeholder="https://..."
                        autoFocus
                        className={`w-56 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      />
                      <button
                        onClick={() => handleFetchUrl('right')}
                        disabled={fetching}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 whitespace-nowrap"
                      >
                        {fetching ? '...' : 'Fetch'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={rightContent} onChange={setRightContent} theme={theme} lineClasses={lineDiffs.rightLines} ariaLabel="Modified JSON editor" />
            </div>
          </div>
        </div>
      ) : (
        <TreeDiffPanel diffResult={diffResult} theme={theme} />
      )}
    </div>
  )
}

export { CompareView }
export default CompareView

function TreeDiffPanel({ diffResult, theme }: { diffResult: DiffResult | null; theme: 'dark' | 'light' }) {
  if (!diffResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Enter valid JSON on both sides to see the diff tree
      </div>
    )
  }

  if (diffResult.totalChanges === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-green-400 text-sm">
        No differences found
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-1">
        {diffResult.changes.map((change, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 px-2 py-1 rounded text-sm font-mono ${
              change.type === 'added'
                ? theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                : change.type === 'removed'
                ? theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                : theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <span className="font-bold w-4 text-center">
              {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{change.path}</span>
            {change.type === 'modified' && (
              <span>
                <span className="text-red-400 line-through">{JSON.stringify(change.oldValue)}</span>
                {' -> '}
                <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
              </span>
            )}
            {change.type === 'added' && (
              <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
            )}
            {change.type === 'removed' && (
              <span className="text-red-400">{JSON.stringify(change.oldValue)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
