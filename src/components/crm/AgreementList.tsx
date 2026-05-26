export function AgreementList({ agreements }: { agreements: any[] }) {
  if (agreements.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No agreements yet.</p>
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {agreements.map((a: any) => (
        <li key={a.id} className="py-3 flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {a.type?.replace('_', ' ')}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">– {a.status}</span>
          </div>
          {a.totalAmount && (
            <span className="text-sm font-semibold">${a.totalAmount.toLocaleString()}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
