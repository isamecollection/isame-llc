import { CollectionConfig } from 'payload'

export const ServiceAttempts: CollectionConfig = {
  slug: 'service-attempts',
  admin: { hidden: true },
  access: {
    create: ({ req: { user } }) =>
      user?.roles?.some((r) =>
        ['process-server', 'court-agent', 'claims-officer', 'admin'].includes(r),
      ) ?? false,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.some((r) => ['court-agent', 'claims-officer', 'admin'].includes(r)))
        return true
      // Process server sees only their own attempts
      return { createdBy: { equals: user.id } }
    },
    update: ({ req: { user } }) =>
      user?.roles?.some((r) =>
        ['process-server', 'court-agent', 'claims-officer', 'admin'].includes(r),
      ) ?? false,
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['court-agent', 'claims-officer', 'admin'].includes(r)) ?? false,
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    {
      name: 'attemptDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'outcome',
      type: 'select',
      options: ['served', 'not_served', 'refused', 'moved', 'deceased', 'other'],
      required: true,
    },
    { name: 'notes', type: 'textarea' },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Photo of the service attempt (e.g., document served, location)' },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.createdBy) {
          data.createdBy = req.user.id
        }
      },
    ],
  },
  timestamps: true,
}
