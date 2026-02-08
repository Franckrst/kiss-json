# KISS JSON

**JSON formatter, validator and comparator — simple, fast, no ads.**

[Try KISS JSON](https://kissjson.com) | [GitHub](https://github.com/Franckrst/kiss-json)

---

## Why KISS JSON?

- **Simple** — Clean interface, zero distractions. Paste your JSON, format, done.
- **Fast** — Everything runs in your browser. No server, no waiting, no size limit.
- **No ads** — No advertising, no tracking, no cookies. Ever.

## Features

- Format / Beautify JSON (2 spaces, 4 spaces, tabs)
- Minify JSON
- Sort keys alphabetically
- Compare two JSON documents side-by-side with visual diff
- Validate JSON with real-time error messages
- Filter by path (e.g. `data.users[0].name`)
- Import from file or URL with drag-and-drop
- Light / Dark theme
- Keyboard shortcuts (`Ctrl+Shift+F` format, `Ctrl+Shift+M` minify, `Ctrl+Shift+S` sort)

## Performance

KISS JSON is designed to feel instant:

- **Code splitting** — FormatView and CompareView are lazy-loaded with `React.lazy` + `Suspense`. You only download what you use.
- **Manual chunks** — Vite splits vendor bundles into separate cacheable chunks: `react-vendor`, `codemirror`, and `diff`. Returning visitors load from cache.
- **Memoization** — All leaf components use `React.memo`. Expensive computations (validation, diffing, filtering) are wrapped in `useMemo`. Callbacks use `useCallback` to avoid unnecessary re-renders.
- **Debouncing** — Path filter input is debounced (200ms) to avoid recomputing on every keystroke. LocalStorage persistence is debounced (500ms).
- **CodeMirror module caching** — CodeMirror modules are loaded once and cached at module level with promise deduplication, so multiple editor instances share a single import.
- **Dynamic imports** — The URL fetch module is only loaded when you click the URL button, keeping the initial bundle small.
- **CSS injection** — `vite-plugin-css-injected-by-js` bundles CSS into JS, eliminating extra HTTP requests and FOUC.

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **CodeMirror 6** — Fast, modular code editor with JSON syntax highlighting
- **Tailwind CSS 4** — Utility-first styling via Vite plugin
- **Vite 7** — Build tool with HMR and optimized chunking
- **diff** — Text diffing for JSON comparison
- **Playwright** — End-to-end testing
- **Vitest** — Unit testing

## Development

```bash
npm install
npm run dev
```

## License

MIT
