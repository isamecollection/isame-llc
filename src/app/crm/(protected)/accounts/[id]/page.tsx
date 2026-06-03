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
import { ContactInfoTab } from '@/components/crm/ContactInfoTab'
import { headers, cookies } from 'next/headers'
import { logAudit } from '@/lib/auditLogger'

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

  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return <p className="text-gray-500">You must be logged in to view this account.</p>
  }

  await logAudit({
    user,
    action: 'view',
    collection: 'accounts',
    documentId: account.id,
    documentName: account.debtorName || account.accountNumber,
  })

  const cookieStore = await cookies()
  const activeRole = cookieStore.get('activeRole')?.value || user.roles?.[0] || null

  const isClient = activeRole === 'client'
  const isProcessServer = activeRole === 'process-server'
  const isClaimsOfficer = activeRole === 'claims-officer'
  const isCourtAgent = activeRole === 'court-agent'
  const isAdmin = activeRole === 'admin'

  const isLimitedView = isProcessServer || isClaimsOfficer || isCourtAgent
  const canManageLegal = isCourtAgent || isClaimsOfficer || isAdmin
  const hasFullAccess = !isLimitedView && !isClient

  const [agreements, payments, scheduled] = hasFullAccess
    ? await Promise.all([
        payload.find({
          collection: 'agreements',
          where: { account: { equals: account.id } },
          limit: 9999,
        }),
        payload.find({
          collection: 'payments',
          where: { account: { equals: account.id } },
          limit: 9999,
        }),
        payload.find({
          collection: 'scheduled-payments',
          where: { account: { equals: account.id } },
          limit: 9999,
        }),
      ])
    : [{ docs: [] }, { docs: [] }, { docs: [] }]

  const clientsRes = await payload.find({ collection: 'clients', sort: 'name', limit: 100 })
  const clients = clientsRes.docs

  const tabs: { label: string; content: React.ReactNode }[] = []

  if (isClient) {
    tabs.push({ label: 'Report', content: <ClientAccountReport accountId={account.id} /> })
  } else if (isLimitedView) {
    // Process Server gets Contact tab first
    if (isProcessServer) {
      tabs.push({ label: 'Contact', content: <ContactInfoTab account={account} /> })
    }
    tabs.push({ label: 'Notes', content: <NotesSection accountId={account.id} /> })
    tabs.push({ label: 'Documents', content: <AccountDocumentsSection accountId={account.id} /> })
    if (isProcessServer || isCourtAgent || isAdmin) {
      tabs.push({ label: 'Service', content: <ServiceAttemptsSection accountId={account.id} /> })
    }
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
  } else {
    tabs.push(
      { label: 'Agreements', content: <AgreementsSection accountId={account.id} /> },
      {
        label: 'Payments',
        content: (
          <>
            <PaymentHistory
              payments={payments.docs}
              accountBalance={account.currentBalance ?? undefined}
            />
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
      { label: 'Notes', content: <NotesSection accountId={account.id} /> },
      { label: 'Documents', content: <AccountDocumentsSection accountId={account.id} /> },
      { label: 'Service', content: <ServiceAttemptsSection accountId={account.id} /> },
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
            <EditAccountForm
              account={account}
              clients={clients}
              userRole={activeRole || undefined}
            />
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

  return (
    <div>
      <AccountHeader
        account={account}
        showMerge={hasFullAccess}
        userRole={activeRole || undefined}
      />
      <Tabs tabs={tabs} />
      {hasFullAccess && (
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
