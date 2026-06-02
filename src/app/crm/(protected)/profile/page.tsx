import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { ChangePasswordForm } from '@/components/crm/ChangePasswordForm'
import { AvatarUpload } from '@/components/crm/AvatarUpload'

export default async function ProfilePage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return <p className="text-gray-500">Unauthorized</p>

  // Refetch user with depth to get avatar URL
  const fullUser = await payload.findByID({ collection: 'users', id: user.id, depth: 1 })

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* Avatar Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-6 text-center">
        <AvatarUpload userId={user.id} currentAvatar={fullUser.avatar} />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-3">
          {fullUser.name || 'User'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{fullUser.email}</p>
        <div className="mt-2">
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            {fullUser.roles?.join(', ') || 'No roles'}
          </span>
        </div>
      </div>

      <ChangePasswordForm userId={user.id} />
    </div>
  )
}
