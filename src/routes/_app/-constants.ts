import { permissionKey, type ModuleKey, type Permission } from '@/lib/permissions'
import type { LinkProps } from '@tanstack/react-router'
import {
  AnchorIcon,
  BellRingIcon,
  ChartColumnIcon,
  FilePenLineIcon,
  HouseIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  SettingsIcon,
  StampIcon,
  TicketIcon,
  UserPlusIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  icon: LucideIcon
  to: LinkProps['to']
  permission?: Permission | Array<Permission>
}

export type NavGroup = { label: string; items: Array<NavItem> }

export const NAV_GROUPS: Array<NavGroup> = [
  {
    label: 'Utama',
    items: [{ title: 'Beranda', icon: LayoutDashboardIcon, to: '/dashboard', permission: 'dashboard.read' }],
  },
  {
    label: 'Pajak Daerah',
    items: [
      { title: 'Pendaftaran WP', icon: UserPlusIcon, to: '/wajib-pajak', permission: 'taxpayers.read' },
      { title: 'Pendataan', icon: FilePenLineIcon, to: '/sptpd', permission: 'sptpd.read' },
      { title: 'Penetapan', icon: StampIcon, to: '/penetapan', permission: 'assessments.read' },
      { title: 'Pembayaran', icon: WalletIcon, to: '/pembayaran', permission: 'payments.read' },
      { title: 'Penagihan', icon: BellRingIcon, to: '/penagihan', permission: 'collections.read' },
    ],
  },
  {
    label: 'Retribusi Daerah',
    items: [
      { title: 'Tanda Masuk Wisata', icon: TicketIcon, to: '/retribusi/tanda-masuk', permission: 'tourism.read' },
      { title: 'Kepelabuhanan', icon: AnchorIcon, to: '/retribusi/kepelabuhanan', permission: 'port.read' },
      { title: 'Retribusi Lainnya', icon: ReceiptIcon, to: '/retribusi/skrd', permission: 'retributions.read' },
    ],
  },
  {
    label: 'PBB & BPHTB',
    items: [
      { title: 'PBB-P2', icon: LandmarkIcon, to: '/pbb', permission: 'pbb.read' },
      { title: 'BPHTB', icon: HouseIcon, to: '/bphtb', permission: 'bphtb.read' },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { title: 'Laporan Realisasi', icon: ChartColumnIcon, to: '/laporan', permission: 'reports.read' },
      { title: 'Pengaturan', icon: SettingsIcon, to: '/pengaturan' },
    ],
  },
]

const ROUTE_MODULES: Array<{ prefix: string; module: ModuleKey }> = [
  { prefix: '/dashboard', module: 'dashboard' },
  { prefix: '/wajib-pajak', module: 'taxpayers' },
  { prefix: '/sptpd', module: 'sptpd' },
  { prefix: '/penetapan', module: 'assessments' },
  { prefix: '/pembayaran', module: 'payments' },
  { prefix: '/penagihan', module: 'collections' },
  { prefix: '/retribusi/tanda-masuk', module: 'tourism' },
  { prefix: '/retribusi/kepelabuhanan', module: 'port' },
  { prefix: '/retribusi/skrd', module: 'retributions' },
  { prefix: '/pbb', module: 'pbb' },
  { prefix: '/bphtb', module: 'bphtb' },
  { prefix: '/laporan', module: 'reports' },
  { prefix: '/pengaturan/target', module: 'settings' },
  { prefix: '/pengaturan/tarif', module: 'settings' },
  { prefix: '/pengaturan/wilayah', module: 'settings' },
  { prefix: '/pengaturan/penandatangan', module: 'settings' },
  { prefix: '/pengaturan/pengguna', module: 'users' },
  { prefix: '/pengaturan/peran', module: 'roles' },
]

const CREATE_SEGMENTS = new Set(['create', 'terbit'])

export function requiredPermission(pathname: string): Permission | null {
  const path = pathname.replace(/\/+$/, '')
  const match = ROUTE_MODULES.filter((r) => path === r.prefix || path.startsWith(`${r.prefix}/`)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0]
  if (!match) return null
  const isCreate = path.split('/').some((segment) => CREATE_SEGMENTS.has(segment))
  return permissionKey(match.module, isCreate ? 'create' : 'read')
}
