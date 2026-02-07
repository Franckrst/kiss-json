import { useState, useMemo, useCallback } from 'react'
import { JsonEditor } from './JsonEditor'
import { computeJsonDiff, DiffResult } from '../utils/json-diff'
import { formatJson } from '../utils/json-format'
import { validateJson } from '../utils/json-validate'

interface CompareViewProps {
  theme: 'dark' | 'light'
  showToast: (msg: string, type?: 'success' | 'error') => void
}

type ViewMode = 'text' | 'tree'

export function CompareView({ theme, showToast }: CompareViewProps) {
  const [leftContent, setLeftContent] = useState('')
  const [rightContent, setRightContent] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('text')

  const leftValid = useMemo(() => validateJson(leftContent), [leftContent])
  const rightValid = useMemo(() => validateJson(rightContent), [rightContent])

  const diffResult = useMemo(() => {
    if (!leftValid.valid || !rightValid.valid) return null
    try {
      return computeJsonDiff(leftContent, rightContent)
    } catch {
      return null
    }
  }, [leftContent, rightContent, leftValid.valid, rightValid.valid])

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

  const handleFormat = useCallback((side: 'left' | 'right') => {
    try {
      if (side === 'left') setLeftContent(formatJson(leftContent))
      else setRightContent(formatJson(rightContent))
    } catch {
      showToast('Invalid JSON', 'error')
    }
  }, [leftContent, rightContent, showToast])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
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
          <span className="ml-auto text-xs text-gray-400">
            {diffResult.totalChanges} {diffResult.totalChanges === 1 ? 'difference' : 'differences'}
          </span>
        )}
      </div>

      {/* Editors side by side */}
      {viewMode === 'text' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-1/2 border-r border-gray-700">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700 text-xs text-gray-400">
              <span>A - Original</span>
              <div className="flex gap-1">
                <button onClick={() => handleFormat('left')} className="px-1 hover:text-white">Format</button>
                <label className="px-1 hover:text-white cursor-pointer">
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('left')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={leftContent} onChange={setLeftContent} theme={theme} />
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700 text-xs text-gray-400">
              <span>B - Modified</span>
              <div className="flex gap-1">
                <button onClick={() => handleFormat('right')} className="px-1 hover:text-white">Format</button>
                <label className="px-1 hover:text-white cursor-pointer">
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('right')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={rightContent} onChange={setRightContent} theme={theme} />
            </div>
          </div>
        </div>
      ) : (
        <TreeDiffPanel diffResult={diffResult} />
      )}
    </div>
  )
}

function TreeDiffPanel({ diffResult }: { diffResult: DiffResult | null }) {
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
                ? 'bg-green-900/30 text-green-300'
                : change.type === 'removed'
                ? 'bg-red-900/30 text-red-300'
                : 'bg-yellow-900/30 text-yellow-300'
            }`}
          >
            <span className="font-bold w-4 text-center">
              {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
            </span>
            <span className="text-gray-400">{change.path}</span>
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
