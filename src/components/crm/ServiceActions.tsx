'use client'
import { useState, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { handleApiError } from '@/lib/errorHandler'

// Compress image before upload
const compressImage = async (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxWidth) {
          width = (width * maxWidth) / height
          height = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.7,
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ServiceActions({ accountId }: { accountId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleMarkServed = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceStatus: 'served', serviceDate }),
      })
      if (res.ok) {
        showToast('Marked as served!')
        setTimeout(() => window.location.reload(), 500)
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to update', 'error')
      }
    } catch (err) {
      showToast(handleApiError(err), 'error')
    }
    setSubmitting(false)
  }

  const handleUploadProof = async () => {
    if (!file) {
      showToast('Please take a photo or select a file', 'error')
      return
    }
    setSubmitting(true)
    try {
      // Compress if over 1MB
      let uploadFile = file
      if (file.size > 1 * 1024 * 1024) {
        showToast('Compressing image...')
        uploadFile = await compressImage(file)
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('accountId', accountId)

      const res = await fetch('/api/service-proof', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (res.ok) {
        showToast('Proof uploaded and marked as served!')
        setTimeout(() => window.location.reload(), 500)
      } else {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }))
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error')
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
        📷 {showUpload ? 'Cancel' : 'Take Photo Proof'}
      </button>

      {showUpload && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Take a photo of the served summons</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            📸 Take Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg border"
              />
              <button
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {file && !preview && <p className="text-xs text-green-600">📎 {file.name}</p>}
          <button
            onClick={handleUploadProof}
            disabled={submitting || !file}
            className="w-full px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Uploading...' : 'Upload Proof & Mark Served'}
          </button>
        </div>
      )}
    </div>
  )
}
