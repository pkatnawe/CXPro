'use client'

import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

export default function EntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const entityId = params.id as string

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Test Procedure</h1>
            <button
              onClick={() => router.push('/inbox')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Inbox
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <p className="text-gray-600">
              Entity detail view for Test Procedure Instance: {entityId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              (Full implementation will be added in Slice-08)
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}