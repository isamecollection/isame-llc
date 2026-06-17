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
import { AssignProcessServer } from '@/components/crm/AssignProcessServer'
import { AffidavitUpload } from '@/components/crm/AffidavitUpload'
import { TriggerCourtCharges } from '@/components/crm/TriggerCourtCharges'
import { headers, cookies } from 'next/headers'
import { logAudit } from '@/lib/auditLogger'
import {
  getHighestRole,
  isLimitedView,
  canManageLegal,
  canAssignProcessServer,
  canApplyCourtCharges,
} from '@/lib/permissions'

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
  if (!user) return <p className="text-gray-500">You must be logged in to view this account.</p>

  await logAudit({
    user,
    action: 'view',
    collection: 'accounts',
    documentId: account.id,
    documentName: account.debtorName || account.accountNumber,
  })

  const cookieStore = await cookies()
  const roles: string[] = user?.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  const clientView = activeRole === 'client'
  const limitedView = isLimitedView(activeRole)
  const manageLegal = canManageLegal(activeRole)
  const fullAccess = !limitedView && !clientView
  const showCourtCharges = canApplyCourtCharges(activeRole)
  const showProcessServerAssign = canAssignProcessServer(activeRole)

  let processServers: any[] = []
  if (showProcessServerAssign) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'process-server' } },
      sort: 'name',
    })
    processServers = res.docs
  }

  // Fetch data with proper types to avoid 'never[]' error
  let agreements: { docs: any[] } = { docs: [] }
  let payments: { docs: any[] } = { docs: [] }
  let scheduled: { docs: any[] } = { docs: [] }

  if (fullAccess || clientView) {
    const [agRes, payRes, schedRes] = await Promise.all([
      fullAccess
        ? payload.find({
            collection: 'agreements',
            where: { account: { equals: account.id } },
            limit: 9999,
          })
        : Promise.resolve({ docs: [] }),
      payload.find({
        collection: 'payments',
        where: { account: { equals: account.id } },
        limit: 9999,
      }),
      fullAccess
        ? payload.find({
            collection: 'scheduled-payments',
            where: { account: { equals: account.id } },
            limit: 9999,
          })
        : Promise.resolve({ docs: [] }),
    ])
    agreements = agRes
    payments = payRes
    scheduled = schedRes
  }

  const clientsRes = await payload.find({ collection: 'clients', sort: 'name', limit: 100 })
  const clients = clientsRes.docs

  const tabs: { label: string; content: React.ReactNode }[] = []

  if (clientView) {
    tabs.push(
      { label: 'Report', content: <ClientAccountReport accountId={account.id} /> },
      {
        label: 'Payments',
        content: (
          <PaymentHistory
            payments={payments.docs}
            accountBalance={account.currentBalance ?? undefined}
            userRoles={roles}
          />
        ),
      },
      {
        label: 'Legal',
        content: <LegalCaseView accountId={account.id} />,
      },
      {
        label: 'Notes',
        content: <NotesSection accountId={account.id} readOnly />,
      },
      {
        label: 'Documents',
        content: <AccountDocumentsSection accountId={account.id} />,
      },
    )
  } else if (limitedView) {
    // ... existing limited view code (unchanged) ...
  } else {
    // ... existing full access tabs (unchanged) ...
  }

  return (
    <div>
      <AccountHeader
        account={account}
        showMerge={fullAccess}
        userRole={activeRole || undefined}
        clientView={clientView}
      />
      <Tabs tabs={tabs} />
      {fullAccess && (
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
