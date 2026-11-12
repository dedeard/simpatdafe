import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type AssessmentKind = 'skpd' | 'skpdkb'
export type AssessmentStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

export type Assessment = {
  id: string
  kind: AssessmentKind
  taxpayerId: string
  objectId: string
  taxCode: string
  period: string
  basis: number
  rate: number
  principal: number
  previouslyPaid: number
  penalty: number
  total: number
  detail: Array<{ label: string; value: string }>
  sourceSptpdId?: string
  createdAt: string
  issuedAt?: string
  dueDate?: string
  status: Exclude<AssessmentStatus, 'overdue'>
  notes?: string
  sspdId?: string
  paidAt?: string
  cancelReason?: string
}

export type AssessmentRow = Omit<Assessment, 'status'> & {
  status: AssessmentStatus
  npwpd: string
  taxpayerName: string
  objectName: string
  taxName: string
}

export type AssessmentStats = { issued: number; total: number; overdue: number; overdueAmount: number }

export type AssessmentInput =
  | {
      kind: 'reklame'
      taxpayerId: string
      objectId: string
      reklame: { type: string; width: number; height: number; sides: number; roadClass: string; start: string; months: number }
      issue: boolean
    }
  | {
      kind: 'airtanah'
      taxpayerId: string
      objectId: string
      airTanah: { meterStart: number; meterEnd: number; use: string; period: string }
      issue: boolean
    }
  | { kind: 'skpdkb'; taxpayerId: string; sptpdId: string; correctedGross: number; notes: string; issue: boolean }

export const ASSESSMENT_STATUS_LABEL: Record<AssessmentStatus, string> = {
  draft: 'Draf',
  issued: 'Terbit',
  paid: 'Lunas',
  overdue: 'Jatuh tempo',
  cancelled: 'Batal',
}

export const listAssessments = (query: TableQuery): Promise<Page<AssessmentRow, AssessmentStats>> => call('assessments.list', query)
export const getAssessment = (id: string) => call('assessments.get', id)
export const createAssessment = (input: AssessmentInput) => call('assessments.create', input)
export const issueAssessment = (id: string) => call('assessments.issue', id)
export const cancelAssessment = (input: { id: string; reason: string }) => call('assessments.cancel', input)
