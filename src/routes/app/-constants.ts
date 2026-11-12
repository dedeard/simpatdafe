import type { LinkProps } from '@tanstack/react-router'
import {
  AnchorIcon,
  BellRingIcon,
  ChartColumnIcon,
  FilePenLineIcon,
  HouseIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  ReceiptIcon,
  SettingsIcon,
  StampIcon,
  TicketIcon,
  UserPlusIcon,
  WalletIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  icon: LucideIcon
  to?: LinkProps['to']
  hint?: string
}

export type NavGroup = { label: string; items: Array<NavItem> }

// Items without `to` are SIMPATDA modules that are not built yet
export const NAV_GROUPS: Array<NavGroup> = [
  {
    label: 'Utama',
    items: [{ title: 'Beranda', icon: LayoutDashboardIcon, to: '/app/dashboard' }],
  },
  {
    label: 'Pajak Daerah',
    items: [
      { title: 'Pendaftaran WP', icon: UserPlusIcon, hint: 'NPWPD & objek pajak' },
      { title: 'Pendataan', icon: FilePenLineIcon, hint: 'SPTPD' },
      { title: 'Penetapan', icon: StampIcon, hint: 'SKPD / SKPDKB' },
      { title: 'Pembayaran', icon: WalletIcon, hint: 'SSPD' },
      { title: 'Penagihan', icon: BellRingIcon, hint: 'STPD & tunggakan' },
    ],
  },
  {
    label: 'Retribusi Daerah',
    items: [
      { title: 'Tanda Masuk Wisata', icon: TicketIcon },
      { title: 'Kepelabuhanan', icon: AnchorIcon },
      { title: 'Retribusi Lainnya', icon: ReceiptIcon, hint: 'SKRD' },
    ],
  },
  {
    label: 'PBB & BPHTB',
    items: [
      { title: 'PBB-P2', icon: LandmarkIcon, hint: 'SPPT' },
      { title: 'BPHTB', icon: HouseIcon },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { title: 'Laporan Realisasi', icon: ChartColumnIcon },
      { title: 'Pengaturan', icon: SettingsIcon },
    ],
  },
]
