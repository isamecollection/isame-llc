'use client'
import { useState, useRef } from 'react'

export function ServiceActions({ accountId }: { accountId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMarkServed = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceStatus: 'served',
          serviceDate: serviceDate,
        }),
      })
      if (res.ok) {
        alert('Marked as served!')
        window.location.reload()
      } else {
        alert('Failed to update')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }

  const handleUploadProof = async () => {
    if (!file) {
      alert('Please select a photo')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('accountId', accountId)

      const res = await fetch('/api/service-proof', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        alert('Proof uploaded and marked as served!')
        window.location.reload()
      } else {
        alert('Upload failed')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={serviceDate}
          onChange={(e) => setServiceDate(e.target.value)}
          className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
        />
        <button
          onClick={handleMarkServed}
          disabled={submitting}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
        >
          ✓ Served
        </button>
      </div>

      <button
        onClick={() => setShowUpload(!showUpload)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        📷 {showUpload ? 'Cancel' : 'Upload Photo Proof'}
      </button>

      {showUpload && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Take a photo of the served summons</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {file && <p className="text-xs text-green-600">📎 {file.name}</p>}
          <button
            onClick={handleUploadProof}
            disabled={submitting || !file}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Uploading...' : 'Upload & Mark Served'}
          </button>
        </div>
      )}
    </div>
  )
}
