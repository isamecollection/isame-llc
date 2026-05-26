import { CollectionConfig } from 'payload'

export const Emails: CollectionConfig = {
  slug: 'emails',
  admin: { hidden: true },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true },
    {
      name: 'direction',
      type: 'select',
      options: ['sent', 'received'],
      defaultValue: 'sent',
    },
    { name: 'sentBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'recipient', type: 'text', required: true }, // renamed from 'to'
    { name: 'subject', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      options: ['sent', 'failed'],
      defaultValue: 'sent',
    },
    { name: 'errorMessage', type: 'text' },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.sentBy) {
          data.sentBy = req.user.id
        }
      },
    ],
  },
  timestamps: true,
}
