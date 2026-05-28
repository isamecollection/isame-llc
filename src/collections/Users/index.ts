import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    create: authenticated,
    read: authenticated,
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { id: { equals: user?.id } }
    },
    // ✅ Only admins and CRM managers can delete users
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 7200,
    cookies: { sameSite: 'Lax', secure: true },
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'CRM Manager', value: 'crm-manager' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Court Agent', value: 'court-agent' },
        { label: 'Collector', value: 'collector' },
        { label: 'Client', value: 'client' },
        { label: 'Debtor', value: 'debtor' },
      ],
      defaultValue: [],
      access: {
        update: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
        create: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
      },
    },
    {
      name: 'supervisor',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
        create: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
      },
    },
  ],
  timestamps: true,
}
