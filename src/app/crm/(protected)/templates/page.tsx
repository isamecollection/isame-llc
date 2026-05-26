import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { TemplateList } from '@/components/crm/templates/TemplateList'
import { CreateTemplateForm } from '@/components/crm/templates/CreateTemplateForm'

export default async function TemplatesPage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r))) {
    redirect('/crm/dashboard')
  }

  const templates = await payload.find({ collection: 'templates', sort: 'name' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Email Templates</h1>
      <CreateTemplateForm />
      <TemplateList templates={templates.docs} />
    </div>
  )
}
