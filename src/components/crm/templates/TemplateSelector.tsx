'use client'
import { useState, useEffect } from 'react'

export function TemplateSelector({
  onSelect,
}: {
  onSelect: (template: { subject: string; body: string }) => void
}) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates?sort=name&limit=50')
      .then((r) => r.json())
      .then((data) => setTemplates(data.docs || []))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) return
    const tpl = templates.find((t) => t.id === id)
    if (tpl) onSelect({ subject: tpl.subject, body: tpl.body })
  }

  if (loading) return null

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Load Template
      </label>
      <select
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <option value="">-- select template --</option>
        {templates.map((t: any) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
