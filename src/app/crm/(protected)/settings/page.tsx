import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CRMSettingsForm } from '@/components/crm/CRMSettingsForm'

export default async function SettingsPage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user?.roles?.includes('admin')) {
    redirect('/crm/dashboard')
  }

  // Get current settings
  const settingsRes = await payload.find({
    collection: 'crm-settings',
    limit: 1,
  })
  const settings = settingsRes.docs[0] || null

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CRM Settings</h1>
      <CRMSettingsForm settings={settings} />
    </div>
  )
}
