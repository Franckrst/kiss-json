interface PathFilterProps {
  path: string
  onPathChange: (path: string) => void
  result: string
  error?: string
  theme?: 'dark' | 'light'
}

export function PathFilter({ path, onPathChange, result, error, theme = 'dark' }: PathFilterProps) {
  return (
    <div className={`flex flex-col h-full border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
      <div className={`p-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <input
          type="text"
          value={path}
          onChange={e => onPathChange(e.target.value)}
          placeholder=".data.users[0].name"
          className={`w-full px-2 py-1 text-sm border rounded placeholder-gray-500 focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
      </div>
      <pre className={`flex-1 p-2 text-sm overflow-auto ${error ? 'text-red-400' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        {error || result}
      </pre>
    </div>
  )
}
