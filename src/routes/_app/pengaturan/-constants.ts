import type { Permission } from '@/lib/permissions'
import { MapIcon, PaletteIcon, ReceiptTextIcon, ShieldCheckIcon, SignatureIcon, TargetIcon, UsersIcon } from 'lucide-react'
import type { SectionTab } from '../-components'

export const SETTINGS_TABS: Array<SectionTab & { permission?: Permission }> = [
  { to: '/pengaturan/target', label: 'Target pendapatan', icon: TargetIcon, permission: 'settings.read' },
  { to: '/pengaturan/tarif', label: 'Tarif', icon: ReceiptTextIcon, permission: 'settings.read' },
  { to: '/pengaturan/wilayah', label: 'Wilayah', icon: MapIcon, permission: 'settings.read' },
  { to: '/pengaturan/pengguna', label: 'Pengguna', icon: UsersIcon, permission: 'users.read' },
  { to: '/pengaturan/peran', label: 'Peran & akses', icon: ShieldCheckIcon, permission: 'roles.read' },
  { to: '/pengaturan/penandatangan', label: 'Penandatangan', icon: SignatureIcon, permission: 'settings.read' },
  { to: '/pengaturan/tampilan', label: 'Tampilan', icon: PaletteIcon },
]
