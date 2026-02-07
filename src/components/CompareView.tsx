import { useState, useMemo, useCallback } from 'react'
import { diffLines } from 'diff'
import { JsonEditor } from './JsonEditor'
import { computeJsonDiff } from '../utils/json-diff'
import type { DiffResult } from '../utils/json-diff'
import { formatJson } from '../utils/json-format'
import { validateJson } from '../utils/json-validate'

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
              <div className="flex gap-1">
                <button onClick={() => handleFormat('left')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
                <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('left')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={leftContent} onChange={setLeftContent} theme={theme} lineClasses={lineDiffs.leftLines} />
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className={`flex items-center justify-between px-2 py-1 border-b text-xs ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
              <span>B - Modified</span>
              <div className="flex gap-1">
                <button onClick={() => handleFormat('right')} className={`px-1 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Format</button>
                <label className={`px-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImport('right')(file)
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor value={rightContent} onChange={setRightContent} theme={theme} lineClasses={lineDiffs.rightLines} />
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
