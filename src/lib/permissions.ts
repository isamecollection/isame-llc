export const ROLE_PRIORITY = [
  'admin',
  'crm-manager',
  'supervisor',
  'claims-officer',
  'court-agent',
  'process-server',
  'collector',
  'client', // ← m
] as const

export type CRMRole = (typeof ROLE_PRIORITY)[number]

export function getHighestRole(roles: string[]): string {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) || 'collector'
}

// ── Client helpers ──
export function isClient(activeRole: string): boolean {
  return activeRole === 'client'
}

// ── Permission checks ──

export function canViewAllAccounts(activeRole: string): boolean {
  // Clients never see all accounts; they are filtered later
  return ['admin', 'crm-manager', 'supervisor', 'claims-officer'].includes(activeRole)
}

export function canManageUsers(activeRole: string): boolean {
  return ['admin', 'crm-manager'].includes(activeRole)
}

export function canManageClients(activeRole: string): boolean {
  return ['admin', 'crm-manager'].includes(activeRole)
}

export function canImportAccounts(activeRole: string): boolean {
  return ['admin', 'crm-manager'].includes(activeRole)
}

export function canViewReports(activeRole: string): boolean {
  // Clients can view reports for their own accounts (filtered elsewhere)
  return ['admin', 'crm-manager', 'supervisor', 'claims-officer', 'client'].includes(activeRole)
}

export function canManageLegal(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'claims-officer', 'court-agent'].includes(activeRole)
}

export function canRecordPayment(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'collector', 'supervisor'].includes(activeRole)
}

export function canSendToLegal(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'supervisor', 'collector'].includes(activeRole)
}

export function canApplyCourtCharges(activeRole: string): boolean {
  return ['admin', 'crm-manager'].includes(activeRole)
}

export function canAssignCollector(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'supervisor'].includes(activeRole)
}

export function canAssignCourtAgent(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'claims-officer'].includes(activeRole)
}

export function canAssignProcessServer(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'court-agent'].includes(activeRole)
}

export function canViewAuditLogs(activeRole: string): boolean {
  return ['admin', 'crm-manager'].includes(activeRole)
}

export function isLimitedView(activeRole: string): boolean {
  // Clients are not "limited view" in the same way; they have a custom restricted view
  return ['process-server', 'claims-officer', 'court-agent'].includes(activeRole)
}

export function isManagementRole(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'supervisor'].includes(activeRole)
}

export function canViewAgentStats(activeRole: string): boolean {
  return ['admin', 'crm-manager', 'supervisor'].includes(activeRole)
}
