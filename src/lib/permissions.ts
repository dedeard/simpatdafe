export type PermissionAction = 'read' | 'create' | 'update' | 'delete'

export const WRITE_ACTIONS = ['create', 'update', 'delete'] as const satisfies ReadonlyArray<PermissionAction>

export const ACTION_LABEL: Record<PermissionAction, string> = {
  read: 'Lihat',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
}

const ALL = ['read', 'create', 'update', 'delete'] as const
const READ = ['read'] as const

export const PERMISSION_GROUPS = [
  {
    label: 'Utama',
    modules: [{ key: 'dashboard', label: 'Beranda', description: 'Ringkasan penerimaan dan indikator kinerja', actions: READ }],
  },
  {
    label: 'Pajak Daerah',
    modules: [
      { key: 'taxpayers', label: 'Pendaftaran WP', description: 'Wajib pajak, objek pajak dan verifikasi NPWPD', actions: ALL },
      { key: 'sptpd', label: 'Pendataan SPTPD', description: 'Laporan omzet bulanan wajib pajak', actions: ALL },
      { key: 'assessments', label: 'Penetapan', description: 'SKPD, SKPDKB dan pajak reklame', actions: ALL },
      { key: 'payments', label: 'Pembayaran', description: 'SSPD, pencatatan bayar dan rekonsiliasi', actions: ALL },
      { key: 'collections', label: 'Penagihan', description: 'STPD, surat teguran dan janji bayar', actions: ALL },
    ],
  },
  {
    label: 'Retribusi Daerah',
    modules: [
      { key: 'tourism', label: 'Tanda masuk wisata', description: 'Penjualan tiket dan rekonsiliasi loket', actions: ALL },
      { key: 'port', label: 'Kepelabuhanan', description: 'Layanan pelabuhan dan data kapal', actions: ALL },
      { key: 'retributions', label: 'Retribusi lainnya', description: 'SKRD persampahan, PBG dan aset', actions: ALL },
    ],
  },
  {
    label: 'PBB & BPHTB',
    modules: [
      { key: 'pbb', label: 'PBB-P2', description: 'Objek PBB dan penerbitan SPPT', actions: ALL },
      { key: 'bphtb', label: 'BPHTB', description: 'Pelaporan dan validasi BPHTB', actions: ALL },
    ],
  },
  {
    label: 'Laporan',
    modules: [{ key: 'reports', label: 'Laporan realisasi', description: 'Realisasi, penerimaan harian dan piutang', actions: READ }],
  },
  {
    label: 'Administrasi',
    modules: [
      { key: 'settings', label: 'Pengaturan umum', description: 'Target, tarif, wilayah dan penandatangan', actions: ['read', 'update'] },
      { key: 'users', label: 'Pengguna', description: 'Akun pegawai dan peran yang dipakai', actions: ALL },
      { key: 'roles', label: 'Peran & hak akses', description: 'Membuat peran dan mengatur izinnya', actions: ALL },
    ],
  },
] as const

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number]
export type PermissionModule = PermissionGroup['modules'][number]
export type ModuleKey = PermissionModule['key']
export type Permission = `${ModuleKey}.${PermissionAction}`

export const PERMISSION_MODULES: ReadonlyArray<PermissionModule> = PERMISSION_GROUPS.flatMap(
  (g): ReadonlyArray<PermissionModule> => g.modules,
)

export function permissionKey(module: ModuleKey, action: PermissionAction): Permission {
  return `${module}.${action}`
}

export function moduleActions(module: PermissionModule): ReadonlyArray<PermissionAction> {
  return module.actions
}

export const ALL_PERMISSIONS: ReadonlyArray<Permission> = PERMISSION_MODULES.flatMap((m) =>
  moduleActions(m).map((action) => permissionKey(m.key, action)),
)

const KNOWN = new Set<string>(ALL_PERMISSIONS)

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && KNOWN.has(value)
}

export function moduleOf(permission: Permission) {
  return permission.slice(0, permission.lastIndexOf('.')) as ModuleKey
}

export function moduleLabel(key: ModuleKey) {
  return PERMISSION_MODULES.find((m) => m.key === key)?.label ?? key
}

// Any write permission implies read on the same module
export function normalizePermissions(list: ReadonlyArray<unknown>): Array<Permission> {
  const set = new Set(list.filter(isPermission))
  for (const permission of [...set]) {
    if (!permission.endsWith('.read')) set.add(permissionKey(moduleOf(permission), 'read'))
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p))
}

export type AccessLevel = 'none' | 'read' | 'write' | 'full'

export function accessLevel(permissions: ReadonlySet<Permission>, module: PermissionModule): AccessLevel {
  const writes = moduleActions(module).filter((a) => a !== 'read')
  const granted = writes.filter((a) => permissions.has(permissionKey(module.key, a)))
  if (writes.length > 0 && granted.length === writes.length) return 'full'
  if (granted.length > 0) return 'write'
  return permissions.has(permissionKey(module.key, 'read')) ? 'read' : 'none'
}

export const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  none: 'Tanpa akses',
  read: 'Baca',
  write: 'Tulis sebagian',
  full: 'Baca & tulis',
}
