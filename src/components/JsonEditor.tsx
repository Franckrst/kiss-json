import { useRef, useEffect, memo, useState } from 'react'

interface JsonEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  theme?: 'dark' | 'light'
  lineClasses?: Map<number, string>
  ariaLabel?: string
}

// Cache CodeMirror modules after first load
let cmCache: Record<string, any> | null = null
let cmPromise: Promise<Record<string, any>> | null = null

function loadCM(): Promise<Record<string, any>> {
  if (cmCache) return Promise.resolve(cmCache)
  if (!cmPromise) {
    cmPromise = Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/commands'),
      import('@codemirror/lang-json'),
      import('@codemirror/language'),
      import('@codemirror/theme-one-dark'),
    ]).then(modules => {
      cmCache = Object.assign({}, ...modules) as Record<string, any>
      return cmCache!
    })
  }
  return cmPromise!
}

function makeLineHighlightHelpers(cm: Record<string, any>) {
  const { StateField, RangeSetBuilder, Decoration, EditorView } = cm

  function buildDecorations(state: any, lineClasses: Map<number, string>) {
    const builder = new RangeSetBuilder()
    for (let i = 1; i <= state.doc.lines; i++) {
      const cls = lineClasses.get(i)
      if (cls) {
        const line = state.doc.line(i)
        builder.add(line.from, line.from, Decoration.line({ class: cls }))
      }
    }
    return builder.finish()
  }

  function createExtension(lineClasses: Map<number, string>) {
    return StateField.define({
      create: (state: any) => buildDecorations(state, lineClasses),
      update: (value: any, tr: any) =>
        tr.docChanged ? buildDecorations(tr.state, lineClasses) : value,
      provide: (f: any) => EditorView.decorations.from(f),
    })
  }

  return { createExtension }
}

export const JsonEditor = memo(function JsonEditor({
  value,
  onChange,
  readOnly = false,
  theme = 'dark',
  lineClasses,
  ariaLabel,
}: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const compartmentRef = useRef<any>(null)
  const helpersRef = useRef<ReturnType<typeof makeLineHighlightHelpers> | null>(null)
  const [ready, setReady] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value
  const lineClassesRef = useRef(lineClasses)
  lineClassesRef.current = lineClasses

  // Load CodeMirror and create editor
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    loadCM().then(cm => {
      if (destroyed || !containerRef.current) return

      const {
        EditorState, Compartment,
        EditorView, keymap, lineNumbers, highlightActiveLine,
        defaultKeymap, history, historyKeymap,
        json, syntaxHighlighting, defaultHighlightStyle, foldGutter, oneDark,
      } = cm

      const helpers = makeLineHighlightHelpers(cm)
      helpersRef.current = helpers

      const hc = new Compartment()
      compartmentRef.current = hc
      const lc = lineClassesRef.current

      const extensions = [
        json(),
        lineNumbers(),
        foldGutter(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.lineWrapping,
        ...(ariaLabel ? [EditorView.contentAttributes.of({ 'aria-label': ariaLabel })] : []),
        ...(theme === 'dark' ? [oneDark] : []),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        ...(onChange
          ? [EditorView.updateListener.of((update: any) => {
              if (update.docChanged) onChange(update.state.doc.toString())
            })]
          : []),
        hc.of(lc && lc.size > 0 ? helpers.createExtension(lc) : []),
      ]

      const state = EditorState.create({ doc: valueRef.current, extensions })
      viewRef.current = new EditorView({ state, parent: containerRef.current })
      setReady(true)
    })

    return () => {
      destroyed = true
      viewRef.current?.destroy()
      viewRef.current = null
      compartmentRef.current = null
      helpersRef.current = null
      setReady(false)
    }
  }, [theme, readOnly])

  // Sync value changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value, ready])

  // Sync line highlight changes
  useEffect(() => {
    const view = viewRef.current
    const hc = compartmentRef.current
    const helpers = helpersRef.current
    if (!view || !hc || !helpers) return

    view.dispatch({
      effects: hc.reconfigure(
        lineClasses && lineClasses.size > 0
          ? helpers.createExtension(lineClasses)
          : []
      ),
    })
  }, [lineClasses, ready])

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={`h-full w-full overflow-auto border rounded ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}
    />
  )
})
