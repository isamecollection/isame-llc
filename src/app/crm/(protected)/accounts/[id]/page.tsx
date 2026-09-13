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
import { getActiveRole } from '@/lib/getActiveRole'
import { logAudit } from '@/lib/auditLogger'
import { AdjustBalanceForm } from '@/components/crm/AdjustBalanceForm'
import {
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

  // Keep roles for PaymentHistory
  const roles: string[] = user?.roles ?? []

  await logAudit({
    user,
    action: 'view',
    collection: 'accounts',
    documentId: account.id,
    documentName: account.debtorName || account.accountNumber,
  })

  // Use the centralized role detection
  const activeRole = await getActiveRole(user)

  const clientView = activeRole === 'client'
  const limitedView = isLimitedView(activeRole)
  const manageLegal = canManageLegal(activeRole)
  const fullAccess = !limitedView && !clientView
  const showCourtCharges = canApplyCourtCharges(activeRole)
  const showProcessServerAssign = canAssignProcessServer(activeRole)

  // Who can adjust balance?
  const canAdjustBalance =
    activeRole === 'admin' || activeRole === 'crm-manager' || activeRole === 'supervisor'

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

  // ── Recent Balance Adjustments (audit log) ──
  let recentAdjustments: any[] = []
  if (canAdjustBalance) {
    try {
      const adjRes = await payload.find({
        collection: 'balance-adjustments',
        where: { account: { equals: account.id } },
        sort: '-createdAt',
        limit: 5,
        depth: 1,
      })
      recentAdjustments = adjRes.docs
    } catch {
      // Collection may not exist yet on fresh deploy
      recentAdjustments = []
    }
  }

  const tabs: { label: string; content: React.ReactNode }[] = []

  if (clientView) {
    // ── Client‑specific tabs ──
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
    // ── Limited view (process-server, court-agent, claims-officer) ──
    if (activeRole === 'process-server') {
      tabs.push({ label: 'Contact', content: <ContactInfoTab account={account} /> })
    }
    tabs.push(
      { label: 'Notes', content: <NotesSection accountId={account.id} /> },
      { label: 'Documents', content: <AccountDocumentsSection accountId={account.id} /> },
    )

    if (
      activeRole === 'process-server' ||
      activeRole === 'court-agent' ||
      activeRole === 'claims-officer' ||
      activeRole === 'admin'
    ) {
      tabs.push({
        label: 'Service',
        content: (
          <div className="space-y-6">
            {activeRole === 'process-server' && (
              <AffidavitUpload accountId={account.id} currentAffidavit={account.affidavitProof} />
            )}
            {(activeRole === 'court-agent' ||
              activeRole === 'claims-officer' ||
              activeRole === 'admin') && (
              <AffidavitUpload
                accountId={account.id}
                currentAffidavit={account.affidavitProof}
                readOnly={true}
              />
            )}
            <ServiceAttemptsSection
              accountId={account.id}
              readOnly={activeRole !== 'process-server'}
            />
          </div>
        ),
      })
    }

    if (manageLegal) {
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
    // ── Full access (admin, crm-manager, supervisor, collector, etc.) ──
    tabs.push(
      { label: 'Agreements', content: <AgreementsSection accountId={account.id} /> },
      {
        label: 'Payments',
        content: (
          <>
            <PaymentHistory
              payments={payments.docs}
              accountBalance={account.currentBalance ?? undefined}
              userRoles={roles}
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
            {showCourtCharges && (
              <TriggerCourtCharges
                accountId={account.id}
                townCity={account.townCity || undefined}
              />
            )}
          </div>
        ),
      },
      { label: 'Emails', content: <EmailsSection accountId={account.id} /> },
      { label: 'Calls', content: <CallsSection accountId={account.id} /> },
      { label: 'Notes', content: <NotesSection accountId={account.id} /> },
      { label: 'Documents', content: <AccountDocumentsSection accountId={account.id} /> },
      {
        label: 'Service',
        content: (
          <div className="space-y-6">
            {showProcessServerAssign && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h4 className="font-semibold mb-3">Assign Process Server</h4>
                <AssignProcessServer accountId={account.id} processServers={processServers} />
              </div>
            )}
            <AffidavitUpload
              accountId={account.id}
              currentAffidavit={account.affidavitProof}
              readOnly={true}
            />
            <ServiceAttemptsSection accountId={account.id} />
          </div>
        ),
      },
      {
        label: 'Legal',
        content: (
          <div className="space-y-6">
            <LegalCaseView accountId={account.id} />
            {manageLegal && (
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
        showMerge={fullAccess}
        userRole={activeRole || undefined}
        clientView={clientView}
      />

      {/* ── Balance Adjustment Panel (management only) ── */}
      {canAdjustBalance && !clientView && (
        <div className="mt-4 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                Balance Integrity
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Current balance is a derived field. Manual changes require a reason and are fully
                audited.
              </p>
            </div>
            <AdjustBalanceForm
              accountId={account.id}
              currentBalance={account.currentBalance ?? 0}
            />
          </div>

          {recentAdjustments.length > 0 && (
            <div className="border-t border-amber-200 dark:border-amber-800 pt-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Recent adjustments{' '}
              </p>
              <ul className="space-y-2 text-xs">
                {recentAdjustments.map((adj: any) => (
                  <li key={adj.id} className="flex flex-col gap-0.5">
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>
                        ${adj.previousBalance?.toLocaleString()} → $
                        {adj.newBalance?.toLocaleString()}
                      </strong>{' '}
                      ({adj.delta >= 0 ? '+' : ''}${adj.delta?.toLocaleString()})
                      {adj.adjustedBy?.name && <> — by {adj.adjustedBy.name}</>}
                    </span>
                    <span className="text-gray-500 italic">{adj.reason}</span>
                    <span className="text-gray-400">
                      {new Date(adj.createdAt).toLocaleString('en-US', {
                        timeZone: 'America/Belize',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
