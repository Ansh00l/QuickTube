'use client'

import { useState } from 'react'
import { VideoInput } from '@/components/VideoInput'
import { SummaryDisplay } from '@/components/SummaryDisplay'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Youtube, Sparkles } from 'lucide-react'

export default function Home() {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSummary = async (url: string) => {
    setLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setSummary(data.summary)
    } catch (err) {
      console.error('Error details:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred while processing the video')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Youtube className="w-8 h-8 text-red-500" />
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          QuickTube
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered YouTube video summarizer
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        <VideoInput onSubmit={handleSummary} loading={loading} />
        
        {loading && <LoadingSpinner />}
        {error && (
          <div className="mt-8 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {summary && <SummaryDisplay summary={summary} />}
      </div>
    </div>
  )
}
