export function ContactInfoTab({ account }: { account: any }) {
  return (
    <div className="space-y-4">
      {/* Service Address - Highlighted */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase text-yellow-700 dark:text-yellow-300 mb-1">
          📍 Service Address
        </p>
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          {account.street || account.address || 'No address provided'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {[account.townCity, account.district].filter(Boolean).join(', ')}
        </p>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {account.phone && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">📞 Phone</p>
            <p className="font-medium">{account.phone}</p>
          </div>
        )}
        {account.email && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">✉️ Email</p>
            <p className="font-medium">{account.email}</p>
          </div>
        )}
        {account.employer && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">🏢 Employer</p>
            <p className="font-medium">{account.employer}</p>
          </div>
        )}
        {account.workPhone && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">📞 Work Phone</p>
            <p className="font-medium">{account.workPhone}</p>
          </div>
        )}
        {account.homePhone && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">🏠 Home Phone</p>
            <p className="font-medium">{account.homePhone}</p>
          </div>
        )}
      </div>
    </div>
  )
}
