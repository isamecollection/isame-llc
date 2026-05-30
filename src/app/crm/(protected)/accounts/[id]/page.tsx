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
import { ArchiveAccountButton } from '@/components/crm/ArchiveAccountButton'
import { SendToLegalButton } from '@/components/crm/SendToLegalButton'
import { ServiceAttemptsSection } from '@/components/crm/ServiceAttemptsSection'
import { ClientAccountReport } from '@/components/crm/ClientAccountReport'
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

  // Authenticate
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return <p className="text-gray-500">You must be logged in to view this account.</p>
  }
  const cookieStore = await cookies()
  const activeRole = cookieStore.get('activeRole')?.value || user.roles?.[0] || null

  const isClient = activeRole === 'client'
  const isLimitedView = activeRole === 'process-server' || activeRole === 'claims-officer'
  const canManageLegal =
    activeRole === 'court-agent' || activeRole === 'claims-officer' || activeRole === 'admin'

  // Fetch data only needed for non‑limited roles
  const [agreements, payments, scheduled] =
    !isLimitedView && !isClient
      ? await Promise.all([
          payload.find({ collection: 'agreements', where: { account: { equals: account.id } } }),
          payload.find({ collection: 'payments', where: { account: { equals: account.id } } }),
          payload.find({
            collection: 'scheduled-payments',
            where: { account: { equals: account.id } },
          }),
        ])
      : [{ docs: [] }, { docs: [] }, { docs: [] }]

  const clientsRes = await payload.find({
    collection: 'clients',
    sort: 'name',
    limit: 100,
  })
  const clients = clientsRes.docs

  // Build the tabs array
  const tabs: { label: string; content: React.ReactNode }[] = []

  // ── CLIENT VIEW: only the Report tab ──
  if (isClient) {
    tabs.push({
      label: 'Report',
      content: <ClientAccountReport accountId={account.id} />,
    })
  }
  // ── NON‑CLIENT VIEWS ──
  else {
    // Tabs visible to everyone (except clients)
    tabs.push({ label: 'Notes', content: <NotesSection accountId={account.id} /> })
    tabs.push({ label: 'Documents', content: <AccountDocumentsSection accountId={account.id} /> })

    // Service tab – visible to process servers, court agents, claims officers, admins
    if (isLimitedView || canManageLegal) {
      tabs.push({ label: 'Service', content: <ServiceAttemptsSection accountId={account.id} /> })
    }

    // Legal tab – visible to court agents, claims officers, admins
    if (canManageLegal) {
      tabs.push({
        label: 'Legal',
        content: (
          <div className="space-y-6">
            <LegalCaseView accountId={account.id} />
            <LegalCaseForm accountId={account.id} />
            <CourtEventsManager accountId={account.id} />
          </div>
        ),
      })
    }

    // Full set of tabs for non‑limited roles (collectors, managers, supervisors, etc.)
    if (!isLimitedView) {
      tabs.unshift(
        { label: 'Agreements', content: <AgreementsSection accountId={account.id} /> },
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
            <div className="space-y-6">
              <ActionsSection accountId={account.id} currentBalance={account.currentBalance ?? 0} />
              <SendToLegalButton accountId={account.id} />
            </div>
          ),
        },
        { label: 'Emails', content: <EmailsSection accountId={account.id} /> },
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
                <ArchiveAccountButton accountId={account.id} archived={account.archived ?? false} />
                <DeleteAccountButton accountId={account.id} />
              </div>
            </div>
          ),
        },
      )
    }
  }

  return (
    <div>
      <AccountHeader account={account} />
      <Tabs tabs={tabs} />
      {!isLimitedView && !isClient && (
        <div className="mt-4">
          <a
            href={`/crm/accounts/${account.id}/merge`}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            Merge Account
          </a>
        </div>
      )}
    </div>
  )
}
