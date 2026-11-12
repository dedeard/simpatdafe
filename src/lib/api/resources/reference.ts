export type Kampung = { id: string; code: string; name: string }
export type Distrik = { id: string; code: string; name: string; kampung: Array<Kampung> }

function d(code: string, name: string, kampung: Array<string>): Distrik {
  const id = `d${code}`
  return {
    id,
    code,
    name,
    kampung: kampung.map((k, i) => {
      const kc = String(i + 1).padStart(2, '0')
      return { id: `${id}k${kc}`, code: kc, name: k }
    }),
  }
}

export const DISTRIK: Array<Distrik> = [
  d('01', 'Kota Waisai', ['Waisai', 'Waisai Kota', 'Warmasen', 'Wawiyai', 'Soraer']),
  d('02', 'Waigeo Selatan', ['Saonek', 'Friwen', 'Saporkren', 'Yenbeser', 'Kabare']),
  d('03', 'Waigeo Barat Kepulauan', ['Kabui', 'Selpele', 'Salio', 'Bianci']),
  d('04', 'Waigeo Utara', ['Kalobo', 'Asukweri', 'Go', 'Mnier']),
  d('05', 'Teluk Mayalibit', ['Waifoi', 'Kalitoko', 'Warsambin', 'Lopintol']),
  d('06', 'Kofiau', ['Deer', 'Tomolol', 'Kapatcol']),
  d('07', 'Salawati Utara', ['Samate', 'Solol', 'Kalobo Salawati', 'Waili']),
  d('08', 'Batanta Utara', ['Yenanas', 'Wailabu', 'Arefi', 'Kabilol']),
  d('09', 'Meos Mansar', ['Arborek', 'Sawinggrai', 'Yenbuba', 'Sawandarek', 'Kapisawar', 'Yenwaupnor']),
  d('10', 'Misool Selatan', ['Yellu', 'Harapan Jaya', 'Fafanlap', 'Gamta', 'Tomolol Misool']),
  d('11', 'Misool Barat', ['Lilinta', 'Magey', 'Kapatcol Misool', 'Atkari']),
  d('12', 'Ayau', ['Rutum', 'Abidon', 'Dorehkar']),
]

export const DISTRIK_NAMES: Record<string, string> = Object.fromEntries(DISTRIK.map((x) => [x.id, x.name]))

export function findDistrik(id: string) {
  return DISTRIK.find((x) => x.id === id)
}

export function distrikName(id: string) {
  return DISTRIK_NAMES[id] ?? '-'
}

export function kampungName(distrikId: string, kampungId: string) {
  return findDistrik(distrikId)?.kampung.find((k) => k.id === kampungId)?.name ?? '-'
}

export type RevenueCategory = 'pajak' | 'retribusi'

export type RevenueLine = {
  code: string
  name: string
  group: string
  category: RevenueCategory
}

export const REVENUE_LINES: Array<RevenueLine> = [
  { code: '4.1.01.12', name: 'PBJT Jasa Perhotelan', group: 'PBJT', category: 'pajak' },
  { code: '4.1.01.11', name: 'PBJT Makanan dan/atau Minuman', group: 'PBJT', category: 'pajak' },
  { code: '4.1.01.13', name: 'PBJT Tenaga Listrik', group: 'PBJT', category: 'pajak' },
  { code: '4.1.01.15', name: 'PBJT Kesenian dan Hiburan', group: 'PBJT', category: 'pajak' },
  { code: '4.1.01.14', name: 'PBJT Jasa Parkir', group: 'PBJT', category: 'pajak' },
  { code: '4.1.01.09', name: 'BPHTB', group: 'Pajak Tanah & Bangunan', category: 'pajak' },
  { code: '4.1.01.10', name: 'PBB-P2', group: 'Pajak Tanah & Bangunan', category: 'pajak' },
  { code: '4.1.01.16', name: 'Pajak Reklame', group: 'Pajak Lainnya', category: 'pajak' },
  { code: '4.1.01.17', name: 'Pajak Air Tanah', group: 'Pajak Lainnya', category: 'pajak' },
  { code: '4.1.01.20', name: 'Pajak MBLB', group: 'Pajak Lainnya', category: 'pajak' },
  { code: '4.1.01.18', name: 'Pajak Sarang Burung Walet', group: 'Pajak Lainnya', category: 'pajak' },
  { code: '4.1.01.19', name: 'Opsen PKB', group: 'Opsen', category: 'pajak' },
  { code: '4.1.01.21', name: 'Opsen BBNKB', group: 'Opsen', category: 'pajak' },
  { code: '4.1.02.02', name: 'Retribusi Tempat Rekreasi & Pariwisata', group: 'Retribusi Jasa Usaha', category: 'retribusi' },
  { code: '4.1.02.04', name: 'Retribusi Pelayanan Kepelabuhanan', group: 'Retribusi Jasa Usaha', category: 'retribusi' },
  { code: '4.1.02.01', name: 'Retribusi Persampahan/Kebersihan', group: 'Retribusi Jasa Umum', category: 'retribusi' },
  { code: '4.1.02.03', name: 'Retribusi Persetujuan Bangunan Gedung', group: 'Retribusi Perizinan Tertentu', category: 'retribusi' },
  { code: '4.1.02.05', name: 'Retribusi Pemakaian Kekayaan Daerah', group: 'Retribusi Jasa Usaha', category: 'retribusi' },
]

export const REVENUE_BY_CODE: Record<string, RevenueLine> = Object.fromEntries(REVENUE_LINES.map((r) => [r.code, r]))

export function revenueName(code: string) {
  return REVENUE_BY_CODE[code]?.name ?? code
}

export const CODE = {
  hotel: '4.1.01.12',
  restaurant: '4.1.01.11',
  electricity: '4.1.01.13',
  entertainment: '4.1.01.15',
  parking: '4.1.01.14',
  bphtb: '4.1.01.09',
  pbb: '4.1.01.10',
  reklame: '4.1.01.16',
  airTanah: '4.1.01.17',
  mblb: '4.1.01.20',
  walet: '4.1.01.18',
  opsenPkb: '4.1.01.19',
  opsenBbnkb: '4.1.01.21',
  tourism: '4.1.02.02',
  port: '4.1.02.04',
  waste: '4.1.02.01',
  pbg: '4.1.02.03',
  assets: '4.1.02.05',
} as const

export type AssessmentMode = 'self' | 'official'

export type TaxType = {
  code: string
  name: string
  assessment: AssessmentMode
  categories: Array<string>
}

export const TAX_TYPES: Array<TaxType> = [
  {
    code: CODE.hotel,
    name: 'PBJT Jasa Perhotelan',
    assessment: 'self',
    categories: ['Homestay', 'Resort', 'Hotel', 'Dive lodge', 'Liveaboard'],
  },
  {
    code: CODE.restaurant,
    name: 'PBJT Makanan dan/atau Minuman',
    assessment: 'self',
    categories: ['Rumah makan', 'Kafe', 'Katering', 'Warung'],
  },
  {
    code: CODE.entertainment,
    name: 'PBJT Kesenian dan Hiburan',
    assessment: 'self',
    categories: ['Karaoke', 'Bar', 'Rental diving & snorkeling', 'Panggung hiburan'],
  },
  { code: CODE.parking, name: 'PBJT Jasa Parkir', assessment: 'self', categories: ['Parkir pelabuhan', 'Parkir pasar', 'Parkir hotel'] },
  { code: CODE.electricity, name: 'PBJT Tenaga Listrik', assessment: 'self', categories: ['Genset resort', 'Genset industri'] },
  { code: CODE.mblb, name: 'Pajak MBLB', assessment: 'self', categories: ['Galian pasir', 'Galian batu', 'Galian kerikil'] },
  { code: CODE.walet, name: 'Pajak Sarang Burung Walet', assessment: 'self', categories: ['Rumah walet'] },
  {
    code: CODE.reklame,
    name: 'Pajak Reklame',
    assessment: 'official',
    categories: ['Papan reklame', 'Spanduk', 'Neon box', 'Reklame kendaraan'],
  },
  { code: CODE.airTanah, name: 'Pajak Air Tanah', assessment: 'official', categories: ['Sumur bor resort', 'Sumur bor industri'] },
]

export const TAX_TYPE_BY_CODE: Record<string, TaxType> = Object.fromEntries(TAX_TYPES.map((t) => [t.code, t]))

export const SELF_ASSESSED_CODES = TAX_TYPES.filter((t) => t.assessment === 'self').map((t) => t.code)

export const ENTITY_LABEL: Record<string, string> = { pribadi: 'Pribadi', badan: 'Badan' }

export const SECTORS = ['Homestay', 'Resort & hotel', 'Rumah makan & kafe', 'Lainnya'] as const

export function sectorOf(taxCode?: string, category?: string) {
  if (taxCode === CODE.hotel) return category === 'Homestay' ? 'Homestay' : 'Resort & hotel'
  if (taxCode === CODE.restaurant) return 'Rumah makan & kafe'
  return 'Lainnya'
}
