import { memo } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContainerProps {
  toasts: ToastItem[]
}

export const ToastContainer = memo(function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded shadow-lg text-sm text-white transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
})
