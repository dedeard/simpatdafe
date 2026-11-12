import { TODAY, endOfMonth, nextMonthKey } from './dates'

type TariffLike = { key: string; value: number; validFrom: string }

export function tariffValue(tariffs: Array<TariffLike>, key: string, date: string = TODAY) {
  let best: TariffLike | undefined
  for (const t of tariffs) {
    if (t.key !== key || t.validFrom > date) continue
    if (!best || t.validFrom > best.validFrom) best = t
  }
  return best?.value ?? 0
}

export function taxDue(gross: number, ratePct: number) {
  return Math.floor((gross * ratePct) / 100)
}

export function sptpdDueDate(period: string) {
  return endOfMonth(nextMonthKey(period))
}

export function interestFor(principal: number, months: number, tariffs: Array<TariffLike>, date: string = TODAY) {
  const ratePct = tariffValue(tariffs, 'interest.month', date)
  const maxMonths = tariffValue(tariffs, 'interest.maxMonths', date) || 24
  const capped = Math.min(Math.max(months, 0), maxMonths)
  return Math.floor((principal * ratePct * capped) / 100)
}

export const REKLAME_TYPES = [
  { value: 'papan', label: 'Papan / billboard' },
  { value: 'spanduk', label: 'Kain / spanduk' },
  { value: 'neon', label: 'Neon box' },
  { value: 'kendaraan', label: 'Reklame kendaraan' },
] as const

export const REKLAME_CLASSES = [
  { value: 'protokol', label: 'Jalan protokol' },
  { value: 'utama', label: 'Jalan utama' },
  { value: 'lingkungan', label: 'Jalan lingkungan' },
] as const

export type ReklameInput = {
  type: string
  width: number
  height: number
  sides: number
  roadClass: string
  months: number
}

export function reklameCalc(input: ReklameInput, tariffs: Array<TariffLike>, date: string = TODAY) {
  const base = tariffValue(tariffs, `reklame.base.${input.type}`, date)
  const multiplier = tariffValue(tariffs, `reklame.class.${input.roadClass}`, date) || 1
  const area = Math.max(input.width, 0) * Math.max(input.height, 0)
  const nsr = Math.floor(area * input.sides * base * multiplier * Math.max(input.months, 0))
  const rate = tariffValue(tariffs, 'rate.4.1.01.16', date)
  return { area, nsr, rate, tax: taxDue(nsr, rate) }
}

export function airTanahCalc(
  input: { meterStart: number; meterEnd: number; use: string },
  tariffs: Array<TariffLike>,
  date: string = TODAY,
) {
  const volume = Math.max(input.meterEnd - input.meterStart, 0)
  const npaPerM3 = tariffValue(tariffs, `airtanah.npa.${input.use}`, date)
  const npa = Math.floor(volume * npaPerM3)
  const rate = tariffValue(tariffs, 'rate.4.1.01.17', date)
  return { volume, npaPerM3, npa, rate, tax: taxDue(npa, rate) }
}

export type EntryCategory = 'mancanegara' | 'domestik' | 'lokal'

export function ticketPrice(category: EntryCategory, tariffs: Array<TariffLike>, date: string = TODAY) {
  return tariffValue(tariffs, `ticket.${category}`, date)
}

export function bphtbCalc(
  input: { price: number; njop: number; transactionType: string },
  tariffs: Array<TariffLike>,
  date: string = TODAY,
) {
  const npop = Math.max(input.price, input.njop)
  const family = input.transactionType === 'waris' || input.transactionType === 'hibah'
  const npoptkp = tariffValue(tariffs, family ? 'bphtb.npoptkp.waris' : 'bphtb.npoptkp', date)
  const npopkp = Math.max(npop - npoptkp, 0)
  const rate = tariffValue(tariffs, 'bphtb.rate', date)
  return { npop, npoptkp, npopkp, rate, amount: taxDue(npopkp, rate), belowNjop: input.price < input.njop }
}

export function spptCalc(njop: number, exemptionApplied: boolean, tariffs: Array<TariffLike>, date: string = TODAY) {
  const njoptkp = exemptionApplied ? tariffValue(tariffs, 'pbb.njoptkp', date) : 0
  const njkp = Math.max(njop - njoptkp, 0)
  const threshold = tariffValue(tariffs, 'pbb.threshold', date)
  const rate = njop >= threshold ? tariffValue(tariffs, 'pbb.rate.high', date) : tariffValue(tariffs, 'pbb.rate.low', date)
  const minimum = tariffValue(tariffs, 'pbb.min', date)
  const raw = Math.floor((njkp * rate) / 100)
  return { njoptkp, njkp, rate, amount: njkp === 0 ? 0 : Math.max(raw, minimum) }
}

export function sum<T>(items: Array<T>, pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function ratio(part: number, whole: number) {
  return whole === 0 ? 0 : part / whole
}
