import {
  ALL_PERMISSIONS,
  normalizePermissions,
  PERMISSION_MODULES,
  permissionKey,
  type ModuleKey,
  type Permission,
} from '@/lib/permissions'
import type { Role } from '../../resources/access'
import { CODE, DISTRIK } from '../../resources/reference'
import type { AppUser, RevenueTarget, Signatory, Tariff } from '../../resources/settings'

const VALID_FROM = '2024-01-01'
const M = 1_000_000

function t(key: string, group: string, name: string, unit: string, value: number, legalBasis: string): Tariff {
  return { id: `tf-${key}`, key, group, name, unit, value, validFrom: VALID_FROM, legalBasis }
}

const PERDA = 'Perda Kab. Raja Ampat tentang Pajak Daerah dan Retribusi Daerah (konfirmasi nomor)'
const PERBUP = 'Perbup Kab. Raja Ampat No. 27 Tahun 2022 (konfirmasi nilai)'

export function seedTariffs(): Array<Tariff> {
  return [
    t(`rate.${CODE.hotel}`, 'Tarif pajak', 'PBJT Jasa Perhotelan', '%', 10, PERDA),
    t(`rate.${CODE.restaurant}`, 'Tarif pajak', 'PBJT Makanan dan/atau Minuman', '%', 10, PERDA),
    t(`rate.${CODE.entertainment}`, 'Tarif pajak', 'PBJT Kesenian dan Hiburan', '%', 10, PERDA),
    t(`rate.${CODE.parking}`, 'Tarif pajak', 'PBJT Jasa Parkir', '%', 10, PERDA),
    t(`rate.${CODE.electricity}`, 'Tarif pajak', 'PBJT Tenaga Listrik (pembangkit sendiri)', '%', 3, PERDA),
    t(`rate.${CODE.mblb}`, 'Tarif pajak', 'Pajak MBLB', '%', 20, PERDA),
    t(`rate.${CODE.walet}`, 'Tarif pajak', 'Pajak Sarang Burung Walet', '%', 10, PERDA),
    t(`rate.${CODE.reklame}`, 'Tarif pajak', 'Pajak Reklame', '%', 25, PERDA),
    t(`rate.${CODE.airTanah}`, 'Tarif pajak', 'Pajak Air Tanah', '%', 20, PERDA),
    t('interest.month', 'Sanksi', 'Bunga keterlambatan per bulan', '% / bulan', 1, PERDA),
    t('interest.maxMonths', 'Sanksi', 'Batas maksimum bulan bunga', 'bulan', 24, PERDA),
    t('bphtb.rate', 'BPHTB', 'Tarif BPHTB', '%', 5, PERDA),
    t('bphtb.npoptkp', 'BPHTB', 'NPOPTKP umum', 'Rp', 80 * M, PERDA),
    t('bphtb.npoptkp.waris', 'BPHTB', 'NPOPTKP waris / hibah keluarga', 'Rp', 300 * M, PERDA),
    t('pbb.njoptkp', 'PBB-P2', 'NJOPTKP per wajib pajak', 'Rp', 10 * M, PERDA),
    t('pbb.rate.low', 'PBB-P2', 'Tarif NJOP di bawah ambang', '%', 0.1, PERDA),
    t('pbb.rate.high', 'PBB-P2', 'Tarif NJOP di atas ambang', '%', 0.2, PERDA),
    t('pbb.threshold', 'PBB-P2', 'Ambang NJOP tarif lebih tinggi', 'Rp', 1_000 * M, PERDA),
    t('pbb.min', 'PBB-P2', 'PBB-P2 minimum', 'Rp', 10_000, PERDA),
    t(
      'ticket.mancanegara',
      'Tanda masuk wisata',
      'Bagian kabupaten, mancanegara',
      'Rp / orang',
      300_000,
      'Perbup tarif tanda masuk (konfirmasi)',
    ),
    t(
      'ticket.domestik',
      'Tanda masuk wisata',
      'Bagian kabupaten, domestik',
      'Rp / orang',
      150_000,
      'Perbup tarif tanda masuk (konfirmasi)',
    ),
    t('ticket.lokal', 'Tanda masuk wisata', 'Bagian kabupaten, lokal Papua', 'Rp / orang', 0, 'Perbup tarif tanda masuk (konfirmasi)'),
    t('port.pas_penumpang', 'Kepelabuhanan', 'Pas penumpang', 'Rp / orang', 5_000, PERBUP),
    t('port.tambat', 'Kepelabuhanan', 'Jasa tambat', 'Rp / GT / etmal', 150, PERBUP),
    t('port.labuh', 'Kepelabuhanan', 'Jasa labuh', 'Rp / GT', 100, PERBUP),
    t('port.bongkar_muat', 'Kepelabuhanan', 'Bongkar muat', 'Rp / ton', 2_000, PERBUP),
    t('port.parkir_kendaraan', 'Kepelabuhanan', 'Parkir kendaraan', 'Rp / kendaraan', 5_000, PERBUP),
    t('reklame.base.papan', 'Reklame', 'Nilai sewa papan / billboard', 'Rp / m² / bulan', 45_000, PERDA),
    t('reklame.base.spanduk', 'Reklame', 'Nilai sewa kain / spanduk', 'Rp / m² / bulan', 15_000, PERDA),
    t('reklame.base.neon', 'Reklame', 'Nilai sewa neon box', 'Rp / m² / bulan', 60_000, PERDA),
    t('reklame.base.kendaraan', 'Reklame', 'Nilai sewa reklame kendaraan', 'Rp / m² / bulan', 25_000, PERDA),
    t('reklame.class.protokol', 'Reklame', 'Pengali jalan protokol', '×', 1.5, PERDA),
    t('reklame.class.utama', 'Reklame', 'Pengali jalan utama', '×', 1.2, PERDA),
    t('reklame.class.lingkungan', 'Reklame', 'Pengali jalan lingkungan', '×', 1, PERDA),
    t('airtanah.npa.niaga', 'Air tanah', 'NPA niaga', 'Rp / m³', 5_500, PERDA),
    t('airtanah.npa.industri', 'Air tanah', 'NPA industri', 'Rp / m³', 7_000, PERDA),
    t('mblb.price.pasir', 'MBLB', 'Harga patokan pasir', 'Rp / m³', 150_000, PERDA),
    t('mblb.price.batu', 'MBLB', 'Harga patokan batu', 'Rp / m³', 200_000, PERDA),
    t('waste.homestay', 'Persampahan', 'Retribusi persampahan homestay', 'Rp / bulan', 100_000, PERDA),
    t('waste.resort', 'Persampahan', 'Retribusi persampahan resort', 'Rp / bulan', 1_500_000, PERDA),
    t('waste.restaurant', 'Persampahan', 'Retribusi persampahan rumah makan', 'Rp / bulan', 150_000, PERDA),
    t('pbg.unit', 'PBG', 'Harga satuan retribusi PBG', 'Rp / m²', 22_000, PERDA),
  ]
}

const TARGET_2026: Record<string, number> = {
  [CODE.hotel]: 22_000,
  [CODE.restaurant]: 4_200,
  [CODE.electricity]: 3_500,
  [CODE.entertainment]: 600,
  [CODE.parking]: 250,
  [CODE.bphtb]: 3_200,
  [CODE.pbb]: 2_800,
  [CODE.reklame]: 450,
  [CODE.airTanah]: 350,
  [CODE.mblb]: 1_600,
  [CODE.walet]: 100,
  [CODE.opsenPkb]: 1_900,
  [CODE.opsenBbnkb]: 800,
  [CODE.tourism]: 20_000,
  [CODE.port]: 2_400,
  [CODE.waste]: 900,
  [CODE.pbg]: 1_200,
  [CODE.assets]: 400,
}

export function seedTargets(): Array<RevenueTarget> {
  const out: Array<RevenueTarget> = []
  for (const [code, jt] of Object.entries(TARGET_2026)) {
    out.push({ year: 2026, code, target: jt * M })
    out.push({ year: 2025, code, target: Math.round((jt * M * 0.92) / 1_000_000) * 1_000_000 })
  }
  return out
}

export const REALIZED_2026: Record<string, number> = {
  [CODE.hotel]: 17_853 * M,
  [CODE.restaurant]: 3_311 * M,
  [CODE.electricity]: 2_984 * M,
  [CODE.entertainment]: 287 * M,
  [CODE.parking]: 118 * M,
  [CODE.bphtb]: 2_706 * M,
  [CODE.pbb]: 1_642 * M,
  [CODE.reklame]: 309 * M,
  [CODE.airTanah]: 221 * M,
  [CODE.mblb]: 1_268 * M,
  [CODE.walet]: 34 * M,
  [CODE.opsenPkb]: 1_517 * M,
  [CODE.opsenBbnkb]: 606 * M,
  [CODE.port]: 1_874 * M,
  [CODE.waste]: 583 * M,
  [CODE.pbg]: 742 * M,
  [CODE.assets]: 232 * M,
}

export function seedUsers(): Array<AppUser> {
  const rows: Array<[string, string, string, string?]> = [
    ['Admin Demo', 'admin@simpatdafe.test', 'admin'],
    ['Yosina Wanma', 'yosina.wanma@bp2rd.test', 'kepala_bidang'],
    ['Frans Mambraku', 'frans.mambraku@bp2rd.test', 'kepala_bidang'],
    ['Dorkas Umpain', 'dorkas.umpain@bp2rd.test', 'operator_pendataan'],
    ['Samuel Kambu', 'samuel.kambu@bp2rd.test', 'operator_pendataan'],
    ['Ruth Fakdawer', 'ruth.fakdawer@bp2rd.test', 'operator_pendataan'],
    ['Daniel Ayelo', 'daniel.ayelo@bp2rd.test', 'operator_penetapan'],
    ['Martha Sauyai', 'martha.sauyai@bp2rd.test', 'operator_penetapan'],
    ['Agustina Mayor', 'agustina.mayor@bp2rd.test', 'bendahara'],
    ['Hendrik Rumbiak', 'hendrik.rumbiak@bp2rd.test', 'bendahara'],
    ['Elisabeth Kacili', 'elisabeth.kacili@bp2rd.test', 'petugas_loket', 'Pelabuhan Waisai'],
    ['Alex Mambor', 'alex.mambor@bp2rd.test', 'petugas_loket', 'Pelabuhan Waisai'],
    ['Siti Hamid', 'siti.hamid@bp2rd.test', 'petugas_loket', 'Pos Misool'],
    ['Markus Arfan', 'markus.arfan@bp2rd.test', 'juru_tagih'],
  ]
  return rows.map(([name, email, roleId, post], i) => ({
    id: `usr-${String(i + 1).padStart(2, '0')}`,
    name,
    email,
    roleId,
    post,
    status: 'active',
  }))
}

export function seedSignatories(): Array<Signatory> {
  const head = 'Kepala BP2RD Kabupaten Raja Ampat'
  return [
    { kind: 'npwpd', label: 'Kartu NPWPD', title: head, name: 'Drs. Markus Dimara, M.Si.', nip: '197508172001121003' },
    { kind: 'sptpd', label: 'SPTPD', title: 'Kepala Bidang Pendataan', name: 'Yosina Wanma, S.E.', nip: '198003252005012006' },
    { kind: 'skpd', label: 'SKPD / SKPDKB', title: head, name: 'Drs. Markus Dimara, M.Si.', nip: '197508172001121003' },
    { kind: 'stpd', label: 'STPD & surat teguran', title: head, name: 'Drs. Markus Dimara, M.Si.', nip: '197508172001121003' },
    { kind: 'sppt', label: 'SPPT PBB-P2', title: head, name: 'Drs. Markus Dimara, M.Si.', nip: '197508172001121003' },
    { kind: 'skrd', label: 'SKRD', title: 'Kepala Bidang Retribusi', name: 'Frans Mambraku, S.Sos.', nip: '198106102006041009' },
    { kind: 'laporan', label: 'Laporan realisasi', title: head, name: 'Drs. Markus Dimara, M.Si.', nip: '197508172001121003' },
  ]
}

export function seedRegions() {
  return DISTRIK.map((d) => ({ ...d, kampung: d.kampung.map((k) => ({ ...k })) }))
}

const read = (...modules: Array<ModuleKey>): Array<Permission> => modules.map((m) => permissionKey(m, 'read'))
const write = (...modules: Array<ModuleKey>): Array<Permission> =>
  modules.flatMap((m) => [permissionKey(m, 'read'), permissionKey(m, 'create'), permissionKey(m, 'update')])

const BUSINESS = PERMISSION_MODULES.map((m) => m.key).filter((k) => k !== 'settings' && k !== 'users' && k !== 'roles')

export function seedRoles(): Array<Role> {
  const role = (id: string, name: string, description: string, permissions: Array<Permission>, system?: boolean): Role => ({
    id,
    name,
    description,
    permissions: normalizePermissions(permissions),
    system,
  })
  return [
    role('admin', 'Administrator', 'Akses penuh ke seluruh modul dan pengaturan sistem.', [...ALL_PERMISSIONS], true),
    role('kepala_bidang', 'Kepala Bidang', 'Memantau semua modul dan menyetujui pendaftaran serta penetapan.', [
      ...read(...BUSINESS),
      'taxpayers.update',
      'assessments.update',
    ]),
    role('operator_pendataan', 'Operator Pendataan', 'Mendaftarkan wajib pajak, mencatat SPTPD dan objek PBB.', [
      ...read('dashboard'),
      ...write('taxpayers', 'sptpd', 'pbb'),
    ]),
    role('operator_penetapan', 'Operator Penetapan', 'Menerbitkan SKPD, SKRD, SPPT dan memvalidasi BPHTB.', [
      ...read('dashboard', 'taxpayers'),
      ...write('assessments', 'retributions', 'pbb', 'bphtb'),
      'collections.read',
      'collections.create',
    ]),
    role('bendahara', 'Bendahara Penerima', 'Mencatat pembayaran dan merekonsiliasi setoran.', [
      ...read('dashboard', 'tourism', 'retributions', 'reports'),
      ...write('payments'),
    ]),
    role('petugas_loket', 'Petugas Loket', 'Menjual tiket wisata dan layanan pelabuhan di pos.', [
      ...read('dashboard'),
      'tourism.create',
      'port.create',
    ]),
    role('juru_tagih', 'Juru Tagih', 'Menindaklanjuti tunggakan dengan STPD dan teguran.', [
      ...read('dashboard', 'taxpayers'),
      ...write('collections'),
    ]),
  ]
}
