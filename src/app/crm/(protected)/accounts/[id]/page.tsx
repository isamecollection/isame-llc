import { getPayload } from '@/payload'
import { notFound } from 'next/navigation'
import { AccountHeader } from '@/components/crm/AccountHeader'
import { Tabs } from '@/components/crm/Tabs'
import { AgreementsSection } from '@/components/crm/AgreementsSection'
import { PaymentHistory } from '@/components/crm/PaymentHistory'
import { ScheduledPaymentsSection } from '@/components/crm/ScheduledPaymentsSection'
import { NotesSection } from '@/components/crm/NotesSection'
import { CallsSection } from '@/components/crm/CallsSection'
import { ActionsSection } from '@/components/crm/ActionsSection'
import { LegalCaseView } from '@/components/crm/LegalCaseView'
import { LegalCaseForm } from '@/components/crm/LegalCaseForm'
import { CourtEventsManager } from '@/components/crm/CourtEventsManager'
import { EditAccountForm } from '@/components/crm/EditAccountForm'
import { DeleteAccountButton } from '@/components/crm/DeleteAccountButton'
import { EmailsSection } from '@/components/crm/EmailsSection'
import { AccountDocumentsSection } from '@/components/crm/AccountDocumentsSection'
import { headers, cookies } from 'next/headers'

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  let account
  try {
    account = await payload.findByID({ collection: 'accounts', id, depth: 1 })
  } catch (error: any) {
    if (error?.status === 404) notFound()
    throw error
  }

  // Authenticate and check legal management permission
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    // The protected layout normally prevents this, but just in case
    return <p className="text-gray-500">You must be logged in to view this account.</p>
  }
  const cookieStore = await cookies()
  const activeRole = cookieStore.get('activeRole')?.value || user.roles?.[0] || null
  const canManageLegal = activeRole === 'court-agent' || activeRole === 'admin'

  const [agreements, payments, scheduled] = await Promise.all([
    payload.find({ collection: 'agreements', where: { account: { equals: account.id } } }),
    payload.find({ collection: 'payments', where: { account: { equals: account.id } } }),
    payload.find({ collection: 'scheduled-payments', where: { account: { equals: account.id } } }),
  ])

  const clientsRes = await payload.find({
    collection: 'clients',
    sort: 'name',
    limit: 100,
  })
  const clients = clientsRes.docs

  return (
    <div>
      <AccountHeader account={account} />
      <Tabs
        tabs={[
          {
            label: 'Agreements',
            content: <AgreementsSection accountId={account.id} />,
          },
          {
            label: 'Payments',
            content: (
              <>
                <PaymentHistory payments={payments.docs} />
                <ScheduledPaymentsSection accountId={account.id} />
              </>
            ),
          },
          {
            label: 'Actions',
            content: (
              <ActionsSection accountId={account.id} currentBalance={account.currentBalance ?? 0} />
            ),
          },
          { label: 'Notes', content: <NotesSection accountId={account.id} /> },
          { label: 'Emails', content: <EmailsSection accountId={account.id} /> },
          {
            label: 'Documents',
            content: <AccountDocumentsSection accountId={account.id} />,
          },
          { label: 'Calls', content: <CallsSection accountId={account.id} /> },
          {
            label: 'Legal',
            content: (
              <div className="space-y-6">
                <LegalCaseView accountId={account.id} />
                {canManageLegal && (
                  <>
                    <LegalCaseForm accountId={account.id} />
                    <CourtEventsManager accountId={account.id} />
                  </>
                )}
              </div>
            ),
          },
          {
            label: 'Edit',
            content: (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-6">
                <EditAccountForm account={account} clients={clients} />
                <hr className="border-gray-200 dark:border-gray-700" />
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h4>
                  <DeleteAccountButton accountId={account.id} />
                </div>
              </div>
            ),
          },
        ]}
      />
      <div className="mt-4">
        <a
          href={`/crm/accounts/${account.id}/merge`}
          className="text-red-600 dark:text-red-400 hover:underline text-sm"
        >
          Merge Account
        </a>
      </div>
    </div>
  )
}
