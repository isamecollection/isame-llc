import { CollectionConfig } from 'payload'

export const AuditLog: CollectionConfig = {
  slug: 'audit-logs',
  admin: { hidden: true },
  access: {
    read: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'action',
      type: 'select',
      options: ['view', 'create', 'update', 'delete', 'assign', 'export'],
    },
    { name: 'collection', type: 'text' },
    { name: 'documentId', type: 'text' },
    { name: 'documentName', type: 'text' },
    { name: 'changes', type: 'json' },
    { name: 'ip', type: 'text' },
    { name: 'userAgent', type: 'text' },
    { name: 'timestamp', type: 'date', defaultValue: () => new Date().toISOString() },
  ],
}
