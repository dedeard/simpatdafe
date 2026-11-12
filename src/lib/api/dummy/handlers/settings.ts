import { REVENUE_LINES } from '../../resources/reference'
import type { AppBootstrap, RegionInput, Signatory, TariffInput, UserInput } from '../../resources/settings'
import { getDb } from '../db'
import { assert } from '../lookup'

export const settingsHandlers = {
  'settings.bootstrap': async (): Promise<AppBootstrap> => {
    const db = await getDb()
    return { regions: db.regions, tariffs: db.tariffs, signatories: db.signatories, users: db.users, roles: db.roles }
  },

  'settings.targets': async (year: number) => {
    const db = await getDb()
    return REVENUE_LINES.map((line) => {
      const t = db.targets.find((x) => x.year === year && x.code === line.code)
      return { code: line.code, name: line.name, group: line.group, category: line.category, target: t?.target ?? 0, revised: t?.revised }
    })
  },

  'settings.saveTargets': async (input: { year: number; items: Array<{ code: string; target: number; revised?: number }> }) => {
    const db = await getDb()
    for (const item of input.items) {
      assert(item.target >= 0 && (item.revised === undefined || item.revised >= 0), 'Target tidak boleh negatif.')
      const existing = db.targets.find((x) => x.year === input.year && x.code === item.code)
      if (existing) Object.assign(existing, { target: item.target, revised: item.revised })
      else db.targets.push({ year: input.year, code: item.code, target: item.target, revised: item.revised })
    }
    return { saved: input.items.length }
  },

  'settings.addTariff': async (input: TariffInput) => {
    const db = await getDb()
    const versions = db.tariffs.filter((t) => t.key === input.key)
    assert(versions.length > 0, 'Tarif tidak ditemukan.')
    assert(input.value >= 0, 'Nilai tarif tidak boleh negatif.')
    assert(/^\d{4}-\d{2}-\d{2}$/.test(input.validFrom), 'Tanggal berlaku tidak valid.')
    const latest = versions.reduce((a, b) => (a.validFrom > b.validFrom ? a : b))
    assert(input.validFrom > latest.validFrom, `Tanggal berlaku harus setelah ${latest.validFrom}.`)
    db.tariffs.push({
      ...latest,
      id: `tf-${input.key}-${input.validFrom}`,
      value: input.value,
      validFrom: input.validFrom,
      legalBasis: input.legalBasis.trim() || latest.legalBasis,
    })
    return { key: input.key }
  },

  'settings.saveRegion': async (input: RegionInput) => {
    const db = await getDb()
    assert(/^\d{2}$/.test(input.code), 'Kode harus 2 digit.')
    assert(input.name.trim(), 'Nama wajib diisi.')
    if (input.level === 'distrik') {
      assert(!db.regions.some((r) => r.code === input.code && r.id !== input.id), 'Kode distrik sudah dipakai.')
      const existing = input.id ? db.regions.find((r) => r.id === input.id) : undefined
      if (existing) Object.assign(existing, { code: input.code, name: input.name.trim() })
      else db.regions.push({ id: `d${input.code}`, code: input.code, name: input.name.trim(), kampung: [] })
    } else {
      const parent = db.regions.find((r) => r.id === input.parentId)
      assert(parent, 'Distrik tidak ditemukan.')
      assert(!parent.kampung.some((k) => k.code === input.code && k.id !== input.id), 'Kode kampung sudah dipakai di distrik ini.')
      const existing = input.id ? parent.kampung.find((k) => k.id === input.id) : undefined
      if (existing) Object.assign(existing, { code: input.code, name: input.name.trim() })
      else parent.kampung.push({ id: `${parent.id}k${input.code}`, code: input.code, name: input.name.trim() })
    }
    return { ok: true as const }
  },

  'settings.saveUser': async (input: UserInput) => {
    const db = await getDb()
    assert(input.name.trim(), 'Nama wajib diisi.')
    assert(/^\S+@\S+\.\S+$/.test(input.email), 'Format email tidak valid.')
    assert(
      !db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase() && u.id !== input.id),
      'Email sudah dipakai pengguna lain.',
    )
    assert(
      db.roles.some((r) => r.id === input.roleId),
      'Peran tidak ditemukan.',
    )
    const user = { ...input, name: input.name.trim(), post: input.post?.trim() || undefined }
    const existing = input.id ? db.users.find((u) => u.id === input.id) : undefined
    if (existing) Object.assign(existing, user)
    else db.users.push({ ...user, id: `usr-${String(db.users.length + 1).padStart(2, '0')}` })
    return { ok: true as const }
  },

  'settings.saveSignatory': async (input: Signatory) => {
    const db = await getDb()
    assert(/^\d{18}$/.test(input.nip), 'NIP harus 18 digit.')
    assert(input.name.trim() && input.title.trim(), 'Nama dan jabatan wajib diisi.')
    const existing = db.signatories.find((s) => s.kind === input.kind)
    assert(existing, 'Jenis dokumen tidak ditemukan.')
    Object.assign(existing, { title: input.title.trim(), name: input.name.trim(), nip: input.nip })
    return { ok: true as const }
  },
}
