import { sanitizeLayout, type DashboardLayout } from '@/lib/dashboard-widgets'
import { normalizePermissions } from '@/lib/permissions'
import type { RoleInput } from '../../resources/access'
import { getDb } from '../db'
import { assert } from '../lookup'

function slugify(text: string) {
  return (
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || 'peran'
  )
}

export const accessHandlers = {
  'access.saveRole': async (input: RoleInput) => {
    const db = await getDb()
    const name = input.name.trim()
    assert(name, 'Nama peran wajib diisi.')
    assert(name.length <= 50, 'Nama peran maksimal 50 karakter.')
    assert(!db.roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== input.id), 'Nama peran sudah dipakai peran lain.')
    const permissions = normalizePermissions(input.permissions)
    assert(permissions.length > 0, 'Pilih minimal satu izin.')

    const existing = input.id ? db.roles.find((r) => r.id === input.id) : undefined
    if (input.id) assert(existing, 'Peran tidak ditemukan.')
    assert(!existing?.system, 'Peran sistem tidak dapat diubah.')

    if (existing) {
      Object.assign(existing, { name, description: input.description.trim(), permissions })
      return { id: existing.id }
    }

    const base = slugify(name)
    let id = base
    for (let n = 2; db.roles.some((r) => r.id === id); n++) id = `${base}_${n}`
    db.roles.push({ id, name, description: input.description.trim(), permissions })
    return { id }
  },

  'access.saveDashboard': async (input: { roleId: string; layout: DashboardLayout | null }) => {
    const db = await getDb()
    const role = db.roles.find((r) => r.id === input.roleId)
    assert(role, 'Peran tidak ditemukan.')
    if (input.layout === null) {
      role.dashboard = null
      return { ok: true as const }
    }
    const layout = sanitizeLayout(input.layout)
    assert(layout.length > 0, 'Dasbor harus memiliki minimal satu widget.')
    role.dashboard = layout
    return { ok: true as const }
  },

  'access.deleteRole': async (id: string) => {
    const db = await getDb()
    const role = db.roles.find((r) => r.id === id)
    assert(role, 'Peran tidak ditemukan.')
    assert(!role.system, 'Peran sistem tidak dapat dihapus.')
    const used = db.users.filter((u) => u.roleId === id).length
    assert(used === 0, `Peran masih dipakai ${used} pengguna. Pindahkan mereka ke peran lain terlebih dahulu.`)
    db.roles = db.roles.filter((r) => r.id !== id)
    return { ok: true as const }
  },
}
