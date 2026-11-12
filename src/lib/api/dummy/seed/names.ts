import type { Rng } from '../rng'

const FIRST = [
  'Yohanis',
  'Maria',
  'Yance',
  'Elisabeth',
  'Markus',
  'Agustina',
  'Daniel',
  'Ruth',
  'Samuel',
  'Yosina',
  'Hendrik',
  'Martha',
  'Frans',
  'Susana',
  'Alex',
  'Dorkas',
  'Ibrahim',
  'Siti',
  'La Ode',
  'Wa Ode',
  'Ahmad',
  'Nurhayati',
  'Budi',
  'Sri',
  'Agus',
  'Dewi',
  'Rudi',
  'Fitri',
  'Obeth',
  'Lidia',
  'Petrus',
  'Yulianus',
  'Naomi',
  'Ferdinand',
  'Rosina',
]

const LAST = [
  'Mambraku',
  'Rumbiak',
  'Wanma',
  'Mayor',
  'Dimara',
  'Sauyai',
  'Umpain',
  'Ayelo',
  'Kambu',
  'Mambor',
  'Fakdawer',
  'Arfan',
  'Kacili',
  'Ohoiledjaan',
  'Siregar',
  'Wibowo',
  'Pattipeilohy',
  'Lestaluhu',
  'Hamid',
  'Saleh',
  'Santoso',
  'Kafiar',
  'Ullo',
  'Tanamal',
  'Dailom',
  'Rumsarwir',
  'Wamafma',
  'Gaman',
  'Sapioper',
  'Sumuri',
]

const FOREIGN_FIRST = [
  'James',
  'Emma',
  'Lukas',
  'Sophie',
  'Marco',
  'Anna',
  'Pierre',
  'Hannah',
  'Daan',
  'Yuki',
  'Liam',
  'Chloe',
  'Oliver',
  'Mia',
  'Noah',
]
const FOREIGN_LAST = [
  'Smith',
  'Müller',
  'Dubois',
  'Rossi',
  'Jansen',
  'Tanaka',
  'Wilson',
  'Garcia',
  'Meier',
  'Brown',
  'Taylor',
  'Lopez',
  'Schmidt',
  'Martin',
  'Chen',
]

export function personName(rng: Rng) {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`
}

export function foreignName(rng: Rng) {
  return `${rng.pick(FOREIGN_FIRST)} ${rng.pick(FOREIGN_LAST)}`
}

export function surname(rng: Rng) {
  return rng.pick(LAST)
}

export function digits(rng: Rng, length: number) {
  let out = ''
  for (let i = 0; i < length; i++) out += String(rng.int(0, 9))
  return out
}

export function nik(rng: Rng) {
  return `9205${digits(rng, 12)}`
}

export function phone(rng: Rng) {
  return `08${rng.pick(['11', '12', '13', '52', '53', '81', '82', '95', '96'])}${digits(rng, 8)}`
}

const ISLANDS = [
  'Kri',
  'Gam',
  'Mansuar',
  'Arborek',
  'Batanta',
  'Pianemo',
  'Wayag',
  'Misool',
  'Kabui',
  'Yenbuba',
  'Friwen',
  'Saleh',
  'Waigeo',
  'Salawati',
  'Kofiau',
  'Fam',
]
const HOMESTAY_WORDS = ['Indah', 'Lestari', 'Paradise', 'Beach', 'Sejahtera', 'Mutiara', 'Karang', 'Bahari', 'Sunrise', 'Papua Asri']
const RESORT_WORDS = ['Eco', 'Blue', 'Coral', 'Bird', 'Manta', 'Lagoon', 'Sea', 'Orchid', 'Paradise', 'Sail']
const DISHES = ['Ikan Bakar', 'Papeda', 'Coto', 'Kuah Kuning', 'Nasi Kuning', 'Sate', 'Seafood', 'Bakso', 'Padang']
const BIZ_WORDS = ['Karya', 'Mandiri', 'Bahari', 'Samudra', 'Tunas', 'Raja', 'Cenderawasih', 'Nusantara', 'Batu Karang', 'Papua']

export function homestayName(rng: Rng, kampung: string) {
  return rng.chance(0.4) ? `Homestay Keluarga ${surname(rng)}` : `Homestay ${kampung} ${rng.pick(HOMESTAY_WORDS)}`
}

export function resortName(rng: Rng, category: string) {
  const island = rng.pick(ISLANDS)
  if (category === 'Dive lodge') return `${island} Dive Lodge`
  if (category === 'Hotel')
    return `Hotel ${rng.pick(['Waisai', 'Raja', 'Cenderawasih', 'Mutiara', 'Dermaga'])} ${rng.pick(['Indah', 'Permai', 'Raya'])}`
  if (category === 'Liveaboard')
    return `Liveaboard ${rng.pick(['Sea Pearl', 'Ocean Spirit', 'Coral Dream', 'Raja Explorer', 'Manta Queen'])}`
  return `${rng.pick(RESORT_WORDS)} ${rng.pick(['Eco Lodge', 'Resort'])} ${island}`
}

export function restaurantName(rng: Rng, category: string, kampung: string) {
  if (category === 'Kafe') return `Kafe ${rng.pick(['Dermaga', 'Senja', 'Karang', 'Pelangi', 'Kopi Papua', 'Teras Laut'])} ${kampung}`
  if (category === 'Katering') return `Katering ${rng.pick(HOMESTAY_WORDS)} ${kampung}`
  if (category === 'Warung') return `Warung ${rng.pick(['Mama', 'Bu', 'Pak'])} ${surname(rng)}`
  return `RM ${rng.pick(DISHES)} ${kampung}`
}

export function businessName(rng: Rng, prefix: string, suffix = '') {
  return `${prefix} ${rng.pick(BIZ_WORDS)}${suffix ? ` ${suffix}` : ''}`
}

export const VESSEL_NAMES = {
  kapal_cepat: ['KM Bahari Express 8B', 'KM Cantika Express', 'KM Sorong Jaya', 'KM Raja Ampat Express', 'KM Wayag Cepat'],
  ferry: ['KMP Marina Papua', 'KMP Sinar Waigeo', 'KMP Teluk Mayalibit'],
  liveaboard: ['Sea Pearl', 'Ocean Spirit', 'Coral Dream', 'Raja Explorer', 'Manta Queen', 'Dewi Nusantara'],
  speedboat: ['SB Dinas Pariwisata 01', 'SB Pelita Laut', 'SB Waigeo Cepat', 'SB Misool Jaya'],
  kapal_barang: ['KM Tunas Harapan', 'KM Pelayaran Timur', 'KM Mutiara Laut'],
  kapal_ikan: ['KM Nelayan Jaya 3', 'KM Samudra Biru', 'KM Cakalang 07'],
} as const
