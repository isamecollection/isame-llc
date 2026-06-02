'use client'
import { useState, useRef } from 'react'
import { useToast } from '@/components/Toast'

export function AvatarUpload({ userId, currentAvatar }: { userId: string; currentAvatar?: any }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const avatarUrl = preview || currentAvatar?.url || currentAvatar?.sizes?.thumbnail?.url

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)

    try {
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        showToast('Profile picture updated!')
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
    <div className="relative inline-block">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">{uploading ? '...' : 'Change'}</span>
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
