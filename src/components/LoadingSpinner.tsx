import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">Processing video transcript...</p>
      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
    </div>
  )
}
