import { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: { hidden: true },
  access: {
    // Anyone can create (the public form), but only admins can read
    create: () => true,
    read: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'source', type: 'text', defaultValue: 'website' },
  ],
  timestamps: true,
}
