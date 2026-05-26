'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function AccountDocumentsSection({ accountId }: { accountId: string }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  const fetchDocuments = async () => {
    setLoading(true)
    const res = await fetch(
      `/api/account-documents?where[account][equals]=${accountId}&sort=-createdAt&depth=1`,
    )
    const data = await res.json()
    setDocuments(data.docs || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [accountId])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return showToast('Please select a file', 'error')

    setUploading(true)

    // First upload the file to media
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    })

    if (!uploadRes.ok) {
      showToast('Failed to upload file', 'error')
      setUploading(false)
      return
    }

    const mediaDoc = await uploadRes.json()

    // Create the account document record
    const docRes = await fetch('/api/account-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        document: mediaDoc.doc.id,
        description,
      }),
    })

    if (docRes.ok) {
      showToast('Document uploaded')
      setFile(null)
      setDescription('')
      fetchDocuments()
    } else {
      showToast('Failed to save document', 'error')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    const res = await fetch(`/api/account-documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Document deleted')
      fetchDocuments()
    } else {
      showToast('Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <form
        onSubmit={handleUpload}
        className="space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
      >
        <h4 className="font-semibold">Upload Document</h4>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {/* Document list */}
      <div>
        <h4 className="font-semibold mb-2">Documents</h4>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No documents uploaded.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc: any) => (
              <div key={doc.id} className="py-2 flex items-center justify-between">
                <div>
                  <a
                    href={doc.document?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {doc.document?.filename || 'Document'}
                  </a>
                  {doc.description && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      – {doc.description}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uploaded {new Date(doc.createdAt).toLocaleString()} by{' '}
                    {(doc.uploadedBy as any)?.name || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 dark:text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
