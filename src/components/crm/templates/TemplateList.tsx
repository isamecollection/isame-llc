'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function TemplateList({ templates }: { templates: any[] }) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    setDeleting(id)
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Template deleted')
      window.location.reload()
    } else {
      showToast('Failed to delete', 'error')
    }
    setDeleting(null)
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Existing Templates</h2>
      {templates.length === 0 && <p className="text-gray-500">No templates yet.</p>}
      <div className="space-y-2">
        {templates.map((t: any) => (
          <div
            key={t.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.subject}</p>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deleting === t.id}
                className="text-red-600 dark:text-red-400 hover:underline text-sm"
              >
                {deleting === t.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
