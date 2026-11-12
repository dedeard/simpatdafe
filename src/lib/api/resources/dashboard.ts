export type RevenueCategory = 'pajak' | 'retribusi'

export type RevenueSource = {
  code: string
  name: string
  group: string
  category: RevenueCategory
  target: number
  realized: number
}

export type MonthlyRevenue = { month: string; pajak: number; retribusi: number }
export type DistrictRevenue = { district: string; amount: number }
export type PaymentChannel = { channel: string; label: string; amount: number; transactions: number }

export type Payment = {
  sspd: string
  npwpd: string
  taxpayer: string
  revenue: string
  amount: number
  channel: string
  paidAt: string
}

export type OverdueAssessment = {
  skpd: string
  npwpd: string
  taxpayer: string
  revenue: string
  period: string
  amount: number
  dueDate: string
  daysOverdue: number
}

export type TourismRetribution = {
  domestic: number
  foreign: number
  ratePerVisitor: number
  uptdCount: number
  bludCount: number
}

export type ReportingCompliance = { period: string; mustReport: number; reported: number; dueDate: string }

export type TaxpayerStats = { active: number; newThisMonth: number; bySector: Array<{ sector: string; count: number }> }

export type DashboardData = {
  fiscalYear: number
  asOf: string
  sources: Array<RevenueSource>
  monthly: Array<MonthlyRevenue>
  districts: Array<DistrictRevenue>
  channels: Array<PaymentChannel>
  recentPayments: Array<Payment>
  overdue: Array<OverdueAssessment>
  tourism: TourismRetribution
  compliance: ReportingCompliance
  taxpayers: TaxpayerStats
  lastYearSamePeriod: number
}

// TODO: replace with real SIMPATDA API calls once the backend exists
const FISCAL_YEAR = 2026
const AS_OF = '2026-11-12T08:30:00+09:00'

const TOURISM: TourismRetribution = {
  domestic: 19_346,
  foreign: 34_812,
  ratePerVisitor: 300_000,
  uptdCount: 54_158,
  bludCount: 49_920,
}

const M = 1_000_000

const SOURCES: Array<RevenueSource> = [
  { code: '4.1.01.12', name: 'PBJT Jasa Perhotelan', group: 'PBJT', category: 'pajak', target: 22_000 * M, realized: 17_853 * M },
  { code: '4.1.01.11', name: 'PBJT Makanan dan/atau Minuman', group: 'PBJT', category: 'pajak', target: 4_200 * M, realized: 3_311 * M },
  { code: '4.1.01.13', name: 'PBJT Tenaga Listrik', group: 'PBJT', category: 'pajak', target: 3_500 * M, realized: 2_984 * M },
  { code: '4.1.01.15', name: 'PBJT Kesenian dan Hiburan', group: 'PBJT', category: 'pajak', target: 600 * M, realized: 287 * M },
  { code: '4.1.01.14', name: 'PBJT Jasa Parkir', group: 'PBJT', category: 'pajak', target: 250 * M, realized: 118 * M },
  { code: '4.1.01.09', name: 'BPHTB', group: 'Pajak Tanah & Bangunan', category: 'pajak', target: 3_200 * M, realized: 2_706 * M },
  { code: '4.1.01.10', name: 'PBB-P2', group: 'Pajak Tanah & Bangunan', category: 'pajak', target: 2_800 * M, realized: 1_642 * M },
  { code: '4.1.01.16', name: 'Pajak Reklame', group: 'Pajak Lainnya', category: 'pajak', target: 450 * M, realized: 309 * M },
  { code: '4.1.01.17', name: 'Pajak Air Tanah', group: 'Pajak Lainnya', category: 'pajak', target: 350 * M, realized: 221 * M },
  { code: '4.1.01.20', name: 'Pajak MBLB', group: 'Pajak Lainnya', category: 'pajak', target: 1_600 * M, realized: 1_268 * M },
  { code: '4.1.01.18', name: 'Pajak Sarang Burung Walet', group: 'Pajak Lainnya', category: 'pajak', target: 100 * M, realized: 34 * M },
  { code: '4.1.01.19', name: 'Opsen PKB', group: 'Opsen', category: 'pajak', target: 1_900 * M, realized: 1_517 * M },
  { code: '4.1.01.21', name: 'Opsen BBNKB', group: 'Opsen', category: 'pajak', target: 800 * M, realized: 606 * M },
  {
    code: '4.1.02.02',
    name: 'Retribusi Tempat Rekreasi & Pariwisata',
    group: 'Retribusi Jasa Usaha',
    category: 'retribusi',
    target: 20_000 * M,
    realized: TOURISM.uptdCount * TOURISM.ratePerVisitor,
  },
  {
    code: '4.1.02.02',
    name: 'Retribusi Pelayanan Kepelabuhanan',
    group: 'Retribusi Jasa Usaha',
    category: 'retribusi',
    target: 2_400 * M,
    realized: 1_874 * M,
  },
  {
    code: '4.1.02.01',
    name: 'Retribusi Persampahan/Kebersihan',
    group: 'Retribusi Jasa Umum',
    category: 'retribusi',
    target: 900 * M,
    realized: 583 * M,
  },
  {
    code: '4.1.02.03',
    name: 'Retribusi Persetujuan Bangunan Gedung',
    group: 'Retribusi Perizinan Tertentu',
    category: 'retribusi',
    target: 1_200 * M,
    realized: 742 * M,
  },
]

// Raja Ampat high season runs roughly October–April; November is month-to-date
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov']
const SEASON_WEIGHTS = [11, 10, 10, 9, 7, 6, 5, 5, 7, 11, 4.5]

function spreadMonthly(sources: Array<RevenueSource>): Array<MonthlyRevenue> {
  const total = (category: RevenueCategory) => sources.filter((s) => s.category === category).reduce((sum, s) => sum + s.realized, 0)
  const weightSum = SEASON_WEIGHTS.reduce((a, b) => a + b, 0)
  const pajak = total('pajak')
  const retribusi = total('retribusi')
  return MONTHS.map((month, i) => ({
    month,
    pajak: Math.round((pajak * SEASON_WEIGHTS[i]) / weightSum),
    retribusi: Math.round((retribusi * SEASON_WEIGHTS[i]) / weightSum),
  }))
}

const DISTRICT_SHARES: Array<[string, number]> = [
  ['Kota Waisai', 0.34],
  ['Meos Mansar', 0.22],
  ['Waigeo Barat Kepulauan', 0.14],
  ['Waigeo Selatan', 0.09],
  ['Misool Selatan', 0.08],
  ['Misool Barat', 0.04],
  ['Salawati Utara', 0.03],
  ['Batanta Utara', 0.02],
  ['Distrik lainnya', 0.04],
]

const DATA: Omit<DashboardData, 'monthly' | 'districts'> = {
  fiscalYear: FISCAL_YEAR,
  asOf: AS_OF,
  sources: SOURCES,
  channels: [
    { channel: 'teller', label: 'Teller Bank Papua', amount: 21_840 * M, transactions: 3_412 },
    { channel: 'va', label: 'Virtual Account', amount: 14_215 * M, transactions: 2_087 },
    { channel: 'qris', label: 'QRIS', amount: 6_932 * M, transactions: 9_864 },
    { channel: 'bendahara', label: 'Bendahara Penerima', amount: 12_313 * M, transactions: 5_219 },
  ],
  recentPayments: [
    {
      sspd: 'SSPD/2026/11/004812',
      npwpd: 'P.2.0001842.09.02',
      taxpayer: 'Resort Teluk Kabui',
      revenue: 'PBJT Jasa Perhotelan',
      amount: 186_450_000,
      channel: 'Virtual Account',
      paidAt: '2026-11-12T08:12:00+09:00',
    },
    {
      sspd: 'TKT/2026/11/018374',
      npwpd: '-',
      taxpayer: 'Pos Pelabuhan Waisai',
      revenue: 'Retribusi Tempat Rekreasi & Pariwisata',
      amount: 42_600_000,
      channel: 'QRIS',
      paidAt: '2026-11-12T07:58:00+09:00',
    },
    {
      sspd: 'SSPD/2026/11/004811',
      npwpd: 'P.2.0000917.09.01',
      taxpayer: 'Homestay Arborek Lestari',
      revenue: 'PBJT Jasa Perhotelan',
      amount: 7_350_000,
      channel: 'QRIS',
      paidAt: '2026-11-11T17:41:00+09:00',
    },
    {
      sspd: 'SSPD/2026/11/004810',
      npwpd: 'P.2.0001203.03.01',
      taxpayer: 'RM Ikan Bakar Waisai',
      revenue: 'PBJT Makanan dan/atau Minuman',
      amount: 4_120_000,
      channel: 'Teller Bank Papua',
      paidAt: '2026-11-11T14:20:00+09:00',
    },
    {
      sspd: 'SSPD/2026/11/004809',
      npwpd: 'P.2.0002261.10.05',
      taxpayer: 'CV Batu Karang Misool',
      revenue: 'Pajak MBLB',
      amount: 28_900_000,
      channel: 'Teller Bank Papua',
      paidAt: '2026-11-11T11:05:00+09:00',
    },
    {
      sspd: 'SSPD/2026/11/004808',
      npwpd: 'P.1.0000388.01.01',
      taxpayer: 'Dive Lodge Kri',
      revenue: 'PBJT Jasa Perhotelan',
      amount: 94_275_000,
      channel: 'Virtual Account',
      paidAt: '2026-11-11T09:47:00+09:00',
    },
    {
      sspd: 'BPHTB/2026/11/000214',
      npwpd: '-',
      taxpayer: 'Yohanis M.',
      revenue: 'BPHTB',
      amount: 12_500_000,
      channel: 'Bendahara Penerima',
      paidAt: '2026-11-10T15:32:00+09:00',
    },
  ],
  overdue: [
    {
      skpd: 'SKPDKB/2026/0087',
      npwpd: 'P.2.0000412.09.02',
      taxpayer: 'Resort Pulau Mansuar',
      revenue: 'PBJT Jasa Perhotelan',
      period: 'Jul 2026',
      amount: 142_800_000,
      dueDate: '2026-08-31',
      daysOverdue: 73,
    },
    {
      skpd: 'SKPDKB/2026/0091',
      npwpd: 'P.2.0000655.09.03',
      taxpayer: 'Eco Lodge Gam',
      revenue: 'PBJT Jasa Perhotelan',
      period: 'Agu 2026',
      amount: 96_150_000,
      dueDate: '2026-09-30',
      daysOverdue: 43,
    },
    {
      skpd: 'SPPT/2026/12.04.007',
      npwpd: 'P.1.0001780.01.01',
      taxpayer: 'PT Samudra Waigeo',
      revenue: 'PBB-P2',
      amount: 38_400_000,
      period: 'TA 2026',
      dueDate: '2026-09-30',
      daysOverdue: 43,
    },
    {
      skpd: 'STPD/2026/0144',
      npwpd: 'P.2.0001522.10.02',
      taxpayer: 'Homestay Sawandarek Indah',
      revenue: 'PBJT Jasa Perhotelan',
      period: 'Sep 2026',
      amount: 8_925_000,
      dueDate: '2026-10-31',
      daysOverdue: 12,
    },
    {
      skpd: 'STPD/2026/0149',
      npwpd: 'P.2.0002034.03.01',
      taxpayer: 'Kafe Dermaga Waisai',
      revenue: 'PBJT Makanan dan/atau Minuman',
      amount: 3_870_000,
      period: 'Sep 2026',
      dueDate: '2026-10-31',
      daysOverdue: 12,
    },
  ],
  tourism: TOURISM,
  compliance: { period: 'Oktober 2026', mustReport: 412, reported: 318, dueDate: '2026-11-30' },
  taxpayers: {
    active: 1_248,
    newThisMonth: 17,
    bySector: [
      { sector: 'Homestay', count: 486 },
      { sector: 'Rumah makan & kafe', count: 212 },
      { sector: 'Resort & hotel', count: 74 },
      { sector: 'Lainnya', count: 476 },
    ],
  },
  lastYearSamePeriod: 45_870 * M,
}

export async function getDashboard(): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 150))
  const taxRealized = SOURCES.filter((s) => s.category === 'pajak').reduce((sum, s) => sum + s.realized, 0)
  return {
    ...DATA,
    monthly: spreadMonthly(SOURCES),
    districts: DISTRICT_SHARES.map(([district, share]) => ({ district, amount: Math.round(taxRealized * share) })),
  }
}
