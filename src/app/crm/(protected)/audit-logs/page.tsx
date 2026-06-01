import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuditLogsPage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  // Only admins and CRM managers can view audit logs
  if (!user?.roles?.some((r: string) => ['admin', 'crm-manager'].includes(r))) {
    redirect('/crm/dashboard')
  }

  const logs = await payload.find({
    collection: 'audit-logs',
    sort: '-timestamp',
    limit: 100,
    depth: 1,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="max-h-[70vh] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Collection</th>
              <th className="px-4 py-3 font-semibold">Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.docs.map((log: any) => (
              <tr
                key={log.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">{log.user?.name || 'Unknown'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.action === 'view'
                        ? 'bg-blue-100 text-blue-700'
                        : log.action === 'create'
                          ? 'bg-green-100 text-green-700'
                          : log.action === 'update'
                            ? 'bg-yellow-100 text-yellow-700'
                            : log.action === 'delete'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{log.collection}</td>
                <td className="px-4 py-3 text-xs">{log.documentName || log.documentId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.docs.length === 0 && (
        <p className="text-gray-500 text-center py-8">No audit logs yet.</p>
      )}
    </div>
  )
}
