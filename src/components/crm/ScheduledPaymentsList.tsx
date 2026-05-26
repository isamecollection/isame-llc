export function ScheduledPaymentsList({ scheduled }: { scheduled: any[] }) {
  if (scheduled.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No scheduled payments.</p>
  }

  return (
    <div>
      <h4 className="font-semibold mb-2">Scheduled Payments</h4>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {scheduled.map((s: any) => (
          <li key={s.id} className="py-2 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${s.amount?.toLocaleString()}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                due {new Date(s.dueDate).toLocaleDateString()}
              </span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                s.status === 'paid'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : s.status === 'missed'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
              }`}
            >
              {s.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
