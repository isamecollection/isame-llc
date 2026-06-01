import { getPayload } from '@/payload'

type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'assign' | 'export'

export async function logAudit({
  user,
  action,
  collection,
  documentId,
  documentName,
  changes,
}: {
  user: any
  action: AuditAction
  collection: string
  documentId?: string
  documentName?: string
  changes?: any
}) {
  try {
    const payload = await getPayload()
    await payload.create({
      collection: 'audit-logs',
      data: {
        user: user.id,
        action,
        collection,
        documentId: documentId || undefined,
        documentName: documentName || undefined,
        changes: changes || undefined,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
