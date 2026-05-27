import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { sendFormEmail } from '@/lib/formEmail' // 👈 new import

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()
  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },

    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },

    // 👇 Override the built‑in form‑submissions collection to add our email hook
    // @ts-ignore – hooks are supported at runtime; type definitions are incomplete
    formSubmissionOverrides: {
      hooks: {
        afterChange: [
          async ({ doc }) => {
            // The submitted field values live in the `submissionData` array.
            const fieldsArray = Array.isArray(doc.submissionData) ? doc.submissionData : []

            // Build an HTML list of field names and values
            const rows = fieldsArray
              .map((item: any) => {
                const label = item.field?.label || item.field || 'Unknown field'
                const value = item.value ?? ''
                return `<p><strong>${label}:</strong> ${value}</p>`
              })
              .join('')

            try {
              await sendFormEmail({
                to: 'info@isame.co',
                subject: 'New Website Lead',
                html: `<h2>New Contact Form Submission</h2>${rows}`,
              })
            } catch (err) {
              console.error('Failed to send lead email', err)
            }

            return doc
          },
        ],
      },
    },
    // 👇 Enable localization on the Forms collection (use @ts-ignore to bypass type mismatch)
    // @ts-ignore
    formCollection: {
      localization: true,
    },

    // 👇 Mark built-in form fields as translatable
    formFields: {
      title: { localized: true },
      submitButtonLabel: { localized: true },
      confirmationMessage: { localized: true },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
