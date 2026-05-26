import { getPayload } from '@/payload'
import { notFound } from 'next/navigation'

export default async function DebtorHistoryPage({
  params,
}: {
  params: Promise<{ ssn: string }>
}) {
  const { ssn } = await params
  const payload = await getPayload()

  const accounts = await payload.find({
    collection: 'accounts',
    where: { ssn: { equals: ssn } },
    sort: '-createdAt',
    depth: 1,
  })

  if (accounts.totalDocs === 0) notFound()

  return (
    <div>
      <h1>Debtor History – SSN: {ssn}</h1>
      <p>Total accounts found: {accounts.totalDocs}</p>

      <div
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: 8,
          marginTop: '1rem',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={headerStyle}>Debtor Name</th>
              <th style={headerStyle}>Client</th>
              <th style={headerStyle}>Account #</th>
              <th style={headerStyle}>Balance</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Assigned Collector</th>
              <th style={headerStyle}>Added</th>
              <th style={headerStyle}></th>
            </tr>
          </thead>
          <tbody>
            {accounts.docs.map((account: any) => (
              <tr key={account.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={cellStyle}>{account.debtorName || 'Unknown'}</td>
                <td style={cellStyle}>{(account.client as any)?.name || '—'}</td>
                <td style={cellStyle}>{account.accountNumber}</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}>{account.status}</td>
                <td style={cellStyle}>
                  {account.assignedCollector
                    ? (account.assignedCollector as any)?.name || account.assignedCollector
                    : '—'}
                </td>
                <td style={cellStyle}>
                  {account.createdAt
                    ? new Date(account.createdAt).toLocaleDateString()
                    : '—'}
                </td>
                <td style={cellStyle}>
                  <a href={/crm/accounts/} style={{ color: 'blue' }}>
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
}
const cellStyle: React.CSSProperties = { padding: '8px 12px' }
