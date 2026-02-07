interface PathFilterProps {
  path: string
  onPathChange: (path: string) => void
  result: string
  error?: string
}

export function PathFilter({ path, onPathChange, result, error }: PathFilterProps) {
  return (
    <div className="flex flex-col h-full border-l border-gray-700">
      <div className="p-2 border-b border-gray-700">
        <input
          type="text"
          value={path}
          onChange={e => onPathChange(e.target.value)}
          placeholder=".data.users[0].name"
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <pre className={`flex-1 p-2 text-sm overflow-auto ${error ? 'text-red-400' : 'text-gray-300'}`}>
        {error || result}
      </pre>
    </div>
  )
}
