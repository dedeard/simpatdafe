export { cn } from 'cn'

const LOCALE = 'id-ID'
const TIME_ZONE = 'Asia/Jayapura'

const rupiah = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat(LOCALE)
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 })

export function formatRupiah(value: number) {
  return rupiah.format(value)
}

export function formatRupiahCompact(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e12) return `Rp ${(value / 1e12).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} T`
  if (abs >= 1e9) return `Rp ${(value / 1e9).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} M`
  if (abs >= 1e6) return `Rp ${(value / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} jt`
  return formatRupiah(value)
}

export function formatNumber(value: number) {
  return number.format(value)
}

export function formatPercent(ratio: number) {
  return percent.format(ratio)
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
