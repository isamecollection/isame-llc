import { getPayload } from '@/payload'

export async function EmailHistory({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const emails = await payload.find({
    collection: 'emails',
    where: { account: { equals: accountId } },
    sort: '-createdAt',
    limit: 20,
    depth: 1, // populate sentBy
  })

  return (
    <div>
      <h4 className="font-semibold mb-2">Sent Emails</h4>
      {emails.docs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No emails sent yet.</p>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {emails.docs.map((email: any) => (
          <li key={email.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">To: {email.to}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{email.subject}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(email.createdAt).toLocaleString()} by{' '}
                  {(email.sentBy as any)?.name || 'Unknown'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  email.status === 'sent'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}
              >
                {email.status}
              </span>
            </div>
            {email.errorMessage && (
              <p className="text-xs text-red-500 mt-1">{email.errorMessage}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
