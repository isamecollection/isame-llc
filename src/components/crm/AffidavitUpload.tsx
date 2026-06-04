'use client'
import { useState, useRef } from 'react'
import { useToast } from '@/components/Toast'

const compressImage = async (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width,
          height = img.height
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
    reader.readAsDataURL(file)
  })
}

export function AffidavitUpload({
  accountId,
  currentAffidavit,
}: {
  accountId: string
  currentAffidavit?: any
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
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

  const handleUpload = async () => {
    if (!file) {
      showToast('Select a file', 'error')
      return
    }
    setUploading(true)
    try {
      let uploadFile = file
      if (file.size > 1 * 1024 * 1024) {
        showToast('Compressing...')
        uploadFile = await compressImage(file)
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('_payload', JSON.stringify({ alt: `Affidavit for account ${accountId}` }))

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (uploadRes.ok) {
        const mediaDoc = await uploadRes.json()
        await fetch(`/api/accounts/${accountId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affidavitProof: mediaDoc.doc.id }),
        })
        showToast('Affidavit uploaded!')
        window.location.reload()
      } else {
        showToast('Upload failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <h4 className="font-semibold mb-3">📜 Affidavit of Service</h4>
      <p className="text-sm text-gray-500 mb-3">
        Upload the signed affidavit after serving the summons.
      </p>

      {currentAffidavit?.url && (
        <div className="mb-3">
          <a
            href={currentAffidavit.url}
            target="_blank"
            className="text-blue-600 hover:underline text-sm"
          >
            📄 View Current Affidavit
          </a>
        </div>
      )}

      <label className="flex flex-col items-center gap-2 cursor-pointer">
        {preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setPreview(null)
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="w-full py-6 px-4 bg-purple-50 dark:bg-purple-900/30 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            <span className="text-3xl block mb-2">📜</span>
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              Tap to Upload Affidavit
            </span>
            <span className="text-xs text-purple-500 dark:text-purple-400 block mt-1">
              Take photo or choose file
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
      </label>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-3 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          {uploading ? 'Uploading...' : 'Upload Affidavit'}
        </button>
      )}
    </div>
  )
}
