import { mongooseAdapter } from '@payloadcms/db-mongodb'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, CollectionConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudinaryStorage } from 'payload-storage-cloudinary'
import { v2 as cloudinary } from 'cloudinary'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { Clients } from './collections/Clients'
import { DebtorReferences } from './collections/DebtorReferences'
import { Emails } from './collections/Emails'
import { CronState } from './collections/CronState'
import { Templates } from './collections/Templates'
import { AccountDocuments } from './collections/AccountDocuments'
import {
  TextColorFeature,
  TextSizeFeature,
  TextLetterSpacingFeature,
  TextLineHeightFeature,
  TextFontFamilyFeature,
} from 'payload-lexical-typography'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

// CRM collections
import { Accounts } from './collections/Accounts'
import { Agreements } from './collections/Agreements'
import { Payments } from './collections/Payments'
//import { ScheduledPayments } from './collections/ScheduledPayments'

import { Events } from './collections/Events'
import { Notes } from './collections/Notes'
import { CallAttempts } from './collections/CallAttempts'
import { LegalCases } from './collections/LegalCases' // ✨ NEW

import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const getStorageURL = ({ public_id, version, resource_type, format }: any) => {
  const isSVG = (typeof public_id === 'string' && public_id.endsWith('.svg')) || format === 'svg'
  return cloudinary.url(public_id, {
    secure: true,
    resource_type: 'image',
    version,
    transformation: isSVG ? [] : [{ quality: 'auto', fetch_format: 'auto' }],
  })
}

// Temporary inline copy (keep as-is until import issue is resolved)
const ScheduledPayments = {
  slug: 'scheduled-payments',
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'dueDate', type: 'date', required: true },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'paid', 'missed', 'cancelled'],
      defaultValue: 'pending',
    },
    { name: 'agreement', type: 'relationship', relationTo: 'agreements' },
  ],
} as CollectionConfig

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || getServerSideURL(),
  cors: [
    getServerSideURL(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter((url): url is string => url !== null),

  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Spanish', code: 'es' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  email: nodemailerAdapter({
    defaultFromAddress: 'info@isame.bz',
    defaultFromName: 'Isame Collection',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),

  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#default'],
      beforeDashboard: ['@/components/BeforeDashboard#default'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      TextColorFeature({
        colors: ['#000000', '#FFFFFF', '#FFD700', '#C0C0C0', '#FF0000', '#00FF00', '#0000FF'],
        colorPicker: true,
      }),
      TextSizeFeature(),
      TextLetterSpacingFeature(),
      TextLineHeightFeature(),
      TextFontFamilyFeature({
        fontFamilies: [
          { label: 'Default', value: 'default' },
          { label: 'Baskervville (Serif)', value: 'Baskervville, serif' },
          { label: 'Prompt (Sans-serif)', value: 'Prompt, sans-serif' },
          { label: 'Playfair Display (Serif)', value: 'Playfair Display, serif' },
          { label: 'Poppins (Sans-serif)', value: 'Poppins, sans-serif' },
          { label: 'Georgia (Serif)', value: 'Georgia, serif' },
          { label: 'Arial (Sans-serif)', value: 'Arial, sans-serif' },
          { label: 'Times New Roman (Serif)', value: 'Times New Roman, serif' },
        ],
        customFontFamily: false,
      }),
    ],
  }),

  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),

  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Accounts,
    Agreements,
    Payments,
    ScheduledPayments,
    Events,
    Notes,
    CallAttempts,
    LegalCases, // ✨ NEW
    Clients,
    DebtorReferences,
    Emails,
    CronState,
    Templates,
    AccountDocuments,
  ],

  globals: [Header, Footer, Settings],

  plugins: [
    ...plugins,
    cloudinaryStorage({
      cloudConfig: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
        api_key: process.env.CLOUDINARY_API_KEY!,
        api_secret: process.env.CLOUDINARY_API_SECRET!,
      },
      collections: {
        media: {
          folder: 'media',
          resourceType: 'image',
          public_id: ({ originalname }: { originalname: string }) => {
            return `media/${originalname}`
          },
          transformation: [],
          deleteFromCloudinary: true,
          getStorageURL,
        } as any,
      },
    }),
  ],

  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const secret = process.env.CRON_SECRET
        if (!secret) return false
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
