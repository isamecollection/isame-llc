import { getPayload } from '@/payload'

export default async function ManagerDashboard() {
  const payload = await getPayload()

  // Fetch all clients with their account stats
  const clients = await payload.find({ collection: 'clients', sort: 'name' })

  const clientStats = await Promise.all(
    clients.docs.map(async (client: any) => {
      const accounts = await payload.find({
        collection: 'accounts',
        where: { client: { equals: client.id } },
      })
      const totalOutstanding = accounts.docs.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)

      // Total collected across all accounts belonging to this client
      const payments = await payload.find({
        collection: 'payments',
        where: {
          and: [
            { status: { equals: 'completed' } },
            { account: { in: accounts.docs.map((a) => a.id) } },
          ],
        },
      })
      const totalCollected = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

      return {
        id: client.id,
        name: client.name,
        prefix: client.prefix,
        totalOutstanding,
        totalCollected,
        accountCount: accounts.totalDocs,
      }
    }),
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>

      <h2 className="text-xl font-semibold mb-3">Client Summary</h2>

      {clientStats.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No clients found.</p>
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Prefix</th>
                <th className="px-4 py-3 font-semibold">Accounts</th>
                <th className="px-4 py-3 font-semibold">Outstanding</th>
                <th className="px-4 py-3 font-semibold">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clientStats.map((s) => (
                <tr
                  key={s.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.prefix}</td>
                  <td className="px-4 py-3">{s.accountCount}</td>
                  <td className="px-4 py-3">${s.totalOutstanding.toLocaleString()}</td>
                  <td className="px-4 py-3">${s.totalCollected.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
