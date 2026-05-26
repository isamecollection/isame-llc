import { CollectionConfig } from 'payload'

export const AccountDocuments: CollectionConfig = {
  slug: 'account-documents',
  admin: { hidden: true },
  access: {
    create: ({ req: { user } }) =>
      user?.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
      false,
    read: ({ req: { user } }) =>
      user?.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
      false,
    update: ({ req: { user } }) =>
      user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false,
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false,
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.uploadedBy) {
          data.uploadedBy = req.user.id
        }
      },
    ],
  },
  timestamps: true,
}
