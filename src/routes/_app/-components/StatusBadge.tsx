import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-chart-4/15 text-chart-4 dark:text-chart-4',
  warning: 'bg-chart-3/20 text-chart-3',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-chart-2/15 text-chart-2',
}

export type StatusMap = Record<string, { label: string; tone: Tone }>

export function StatusBadge({ status, map }: { status: string; map: StatusMap }) {
  const entry = map[status] ?? { label: status, tone: 'neutral' as Tone }
  return (
    <Badge variant="secondary" className={cn('font-medium', TONE[entry.tone])}>
      {entry.label}
    </Badge>
  )
}

export const TAXPAYER_STATUS_MAP: StatusMap = {
  draft: { label: 'Draf', tone: 'neutral' },
  verification: { label: 'Verifikasi', tone: 'warning' },
  active: { label: 'Aktif', tone: 'success' },
  suspended: { label: 'Non-aktif sementara', tone: 'warning' },
  closed: { label: 'Tutup', tone: 'neutral' },
}

export const SPTPD_STATUS_MAP: StatusMap = {
  draft: { label: 'Draf', tone: 'neutral' },
  submitted: { label: 'Dilaporkan', tone: 'info' },
  verified: { label: 'Diverifikasi', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
}

export const ASSESSMENT_STATUS_MAP: StatusMap = {
  draft: { label: 'Draf', tone: 'neutral' },
  issued: { label: 'Terbit', tone: 'info' },
  paid: { label: 'Lunas', tone: 'success' },
  overdue: { label: 'Jatuh tempo', tone: 'danger' },
  cancelled: { label: 'Batal', tone: 'neutral' },
}

export const SSPD_STATUS_MAP: StatusMap = {
  pending: { label: 'Menunggu bayar', tone: 'warning' },
  paid: { label: 'Lunas', tone: 'success' },
  expired: { label: 'Kedaluwarsa', tone: 'neutral' },
  void: { label: 'Dibatalkan', tone: 'danger' },
}

export const STPD_STATUS_MAP: StatusMap = {
  issued: { label: 'Terbit', tone: 'info' },
  reminded: { label: 'Teguran', tone: 'warning' },
  forced: { label: 'Surat paksa', tone: 'danger' },
  paid: { label: 'Lunas', tone: 'success' },
  belum: { label: 'Belum ditagih', tone: 'neutral' },
}

export const SKRD_STATUS_MAP: StatusMap = {
  issued: { label: 'Terbit', tone: 'info' },
  paid: { label: 'Lunas', tone: 'success' },
  overdue: { label: 'Jatuh tempo', tone: 'danger' },
  cancelled: { label: 'Batal', tone: 'neutral' },
}

export const BPHTB_STATUS_MAP: StatusMap = {
  submitted: { label: 'Diajukan', tone: 'info' },
  verified: { label: 'Diverifikasi', tone: 'warning' },
  paid: { label: 'Dibayar', tone: 'info' },
  validated: { label: 'Tervalidasi', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
}

export const SPPT_STATUS_MAP: StatusMap = {
  issued: { label: 'Terbit', tone: 'info' },
  paid: { label: 'Lunas', tone: 'success' },
  overdue: { label: 'Jatuh tempo', tone: 'danger' },
}

export const PORT_STATUS_MAP: StatusMap = {
  unpaid: { label: 'Belum dibayar', tone: 'warning' },
  paid: { label: 'Lunas', tone: 'success' },
}
