import { useRef, useEffect, memo } from 'react'
import { EditorState, Compartment, StateField, RangeSetBuilder } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, Decoration } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface JsonEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  theme?: 'dark' | 'light'
  lineClasses?: Map<number, string>
}

function buildLineDecorations(state: EditorState, lineClasses: Map<number, string>) {
  const builder = new RangeSetBuilder<Decoration>()
  for (let i = 1; i <= state.doc.lines; i++) {
    const cls = lineClasses.get(i)
    if (cls) {
      const line = state.doc.line(i)
      builder.add(line.from, line.from, Decoration.line({ class: cls }))
    }
  }
  return builder.finish()
}

function createLineHighlightExtension(lineClasses: Map<number, string>) {
  return StateField.define({
    create(state) {
      return buildLineDecorations(state, lineClasses)
    },
    update(value, tr) {
      if (tr.docChanged) {
        return buildLineDecorations(tr.state, lineClasses)
      }
      return value
    },
    provide: f => EditorView.decorations.from(f)
  })
}

export const JsonEditor = memo(function JsonEditor({ value, onChange, readOnly = false, theme = 'dark', lineClasses }: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const highlightCompartment = useRef(new Compartment())

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      json(),
      lineNumbers(),
      foldGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      ...(theme === 'dark' ? [oneDark] : []),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ...(onChange
        ? [EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          })]
        : []),
      highlightCompartment.current.of(
        lineClasses && lineClasses.size > 0
          ? createLineHighlightExtension(lineClasses)
          : []
      ),
    ]

    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => view.destroy()
  }, [theme, readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: highlightCompartment.current.reconfigure(
        lineClasses && lineClasses.size > 0
          ? createLineHighlightExtension(lineClasses)
          : []
      ),
    })
  }, [lineClasses])

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-auto border rounded ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}
    />
  )
})
