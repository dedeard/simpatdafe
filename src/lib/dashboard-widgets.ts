import type { Permission } from './permissions'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  sm: 'Kecil (1 kolom)',
  md: 'Sedang (2 kolom)',
  lg: 'Besar (3 kolom)',
  full: 'Lebar penuh',
}

type WidgetMeta = {
  id: string
  title: string
  description: string
  permission: Permission
  sizes: ReadonlyArray<WidgetSize>
  defaultSize: WidgetSize
}

export const DASHBOARD_WIDGETS = [
  {
    id: 'kpi-realization',
    title: 'Realisasi PAD',
    description: 'Total realisasi dan capaian target tahun berjalan',
    permission: 'reports.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'kpi-month',
    title: 'Penerimaan bulan ini',
    description: 'Penerimaan berjalan dan pertumbuhan dibanding tahun lalu',
    permission: 'payments.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'kpi-taxpayers',
    title: 'Wajib pajak aktif',
    description: 'Jumlah NPWPD aktif dan pendaftaran baru bulan ini',
    permission: 'taxpayers.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'kpi-overdue',
    title: 'Piutang jatuh tempo',
    description: 'Total ketetapan yang belum dibayar',
    permission: 'collections.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'monthly-revenue',
    title: 'Penerimaan bulanan',
    description: 'Grafik pajak dan retribusi per bulan',
    permission: 'reports.read',
    sizes: ['md', 'lg', 'full'],
    defaultSize: 'lg',
  },
  {
    id: 'payment-channels',
    title: 'Kanal pembayaran',
    description: 'Porsi penerimaan per kanal bayar',
    permission: 'payments.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'revenue-sources',
    title: 'Realisasi per jenis pendapatan',
    description: 'Target dan realisasi tiap jenis pajak dan retribusi',
    permission: 'reports.read',
    sizes: ['lg', 'full'],
    defaultSize: 'lg',
  },
  {
    id: 'compliance',
    title: 'Kepatuhan SPTPD',
    description: 'Persentase wajib pajak yang sudah melapor',
    permission: 'sptpd.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'recent-payments',
    title: 'Pembayaran terbaru',
    description: 'SSPD dan tiket yang baru tervalidasi',
    permission: 'payments.read',
    sizes: ['md', 'lg', 'full'],
    defaultSize: 'lg',
  },
  {
    id: 'overdue',
    title: 'Perlu tindak lanjut penagihan',
    description: 'Ketetapan lewat jatuh tempo, terlama di atas',
    permission: 'collections.read',
    sizes: ['sm', 'md', 'lg'],
    defaultSize: 'sm',
  },
  {
    id: 'tourism',
    title: 'Retribusi tanda masuk',
    description: 'Kunjungan wisatawan dan penerimaan tiket',
    permission: 'tourism.read',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
  },
  {
    id: 'districts',
    title: 'Penerimaan per distrik',
    description: 'Sebaran penerimaan menurut lokasi objek pajak',
    permission: 'reports.read',
    sizes: ['md', 'lg', 'full'],
    defaultSize: 'lg',
  },
] as const satisfies ReadonlyArray<WidgetMeta>

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]['id']
export type DashboardWidget = WidgetMeta & { id: WidgetId }
export type LayoutItem = { id: WidgetId; size: WidgetSize }
export type DashboardLayout = Array<LayoutItem>

const BY_ID = new Map<string, DashboardWidget>(DASHBOARD_WIDGETS.map((w) => [w.id, w]))

export function widgetMeta(id: WidgetId): DashboardWidget {
  return BY_ID.get(id) as DashboardWidget
}

export function sanitizeLayout(raw: unknown): DashboardLayout {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: DashboardLayout = []
  for (const entry of raw) {
    const id = typeof entry === 'object' && entry !== null ? (entry as { id?: unknown }).id : undefined
    const meta = typeof id === 'string' ? BY_ID.get(id) : undefined
    if (!meta || seen.has(meta.id)) continue
    seen.add(meta.id)
    const size = (entry as { size?: unknown }).size
    out.push({ id: meta.id, size: meta.sizes.includes(size as WidgetSize) ? (size as WidgetSize) : meta.defaultSize })
  }
  return out
}

export function defaultLayout(can: (permission: Permission) => boolean): DashboardLayout {
  return DASHBOARD_WIDGETS.filter((w) => can(w.permission)).map((w) => ({ id: w.id, size: w.defaultSize }))
}

export function permittedLayout(layout: DashboardLayout, can: (permission: Permission) => boolean): DashboardLayout {
  return layout.filter((item) => can(widgetMeta(item.id).permission))
}
