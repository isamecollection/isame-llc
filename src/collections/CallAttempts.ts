import { CollectionConfig } from 'payload'

export const CallAttempts: CollectionConfig = {
  slug: 'call-attempts',
  admin: { hidden: true },
  access: {
    // Allow any authenticated CRM user to create, read, and update call attempts
    create: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false
    },
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    {
      name: 'contactType',
      type: 'select',
      options: ['debtor', 'reference'],
      required: true,
    },
    {
      name: 'referenceName',
      type: 'text',
      admin: {
        condition: (data) => data.contactType === 'reference',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
    },
    {
      name: 'callDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        placeholder: 'seconds',
      },
    },
    {
      name: 'outcome',
      type: 'select',
      options: [
        'no_answer',
        'voicemail',
        'right_party_contact',
        'wrong_number',
        'disconnected',
        'callback_requested',
        'other',
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user) {
          data.createdBy = req.user.id
        }
      },
    ],
  },
  timestamps: true,
}
