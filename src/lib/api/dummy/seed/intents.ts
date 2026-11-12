import { TODAY, addDays, toIso } from '@/lib/dates'
import type { Channel } from '../../resources/payments'
import { openSspd, type Bill } from '../bills'
import type { Db } from '../db'
import type { Rng } from '../rng'

export type PayIntent = {
  bill: Bill
  createdAt: string
  paidAt: string
  channel: Channel
}

export type Ctx = {
  db: Db
  rng: Rng
  intents: Array<PayIntent>
  paid: Set<string>
}

export const refKey = (bill: Pick<Bill, 'ref'>) => `${bill.ref.kind}:${bill.ref.id}`

export function pickChannel(rng: Rng, amount: number): Channel {
  if (amount < 3_000_000) {
    return rng.weighted<Channel>([
      ['qris', 40],
      ['teller', 20],
      ['va', 20],
      ['bendahara', 20],
    ])
  }
  if (amount < 50_000_000) {
    return rng.weighted<Channel>([
      ['teller', 40],
      ['va', 30],
      ['bendahara', 20],
      ['qris', 10],
    ])
  }
  return rng.weighted<Channel>([
    ['va', 50],
    ['teller', 40],
    ['bendahara', 8],
    ['qris', 2],
  ])
}

export function businessTime(rng: Rng, channel: Channel) {
  if (channel === 'qris') return `${String(rng.int(6, 21)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`
  return `${String(rng.int(8, 14)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`
}

export function clampDate(date: string) {
  return date > TODAY ? TODAY : date
}

export function addIntent(ctx: Ctx, bill: Bill, createdAt: string, payDate: string, channel?: Channel) {
  const chosen = channel ?? pickChannel(ctx.rng, bill.amount)
  const date = clampDate(payDate)
  ctx.intents.push({ bill, createdAt, paidAt: toIso(date, businessTime(ctx.rng, chosen)), channel: chosen })
  ctx.paid.add(refKey(bill))
}

export function finalizePayments(ctx: Ctx) {
  const sorted = [...ctx.intents].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const bankSeq = new Map<string, number>()
  for (const intent of sorted) {
    const day = intent.paidAt.slice(0, 10).replaceAll('-', '')
    const seq = (bankSeq.get(day) ?? 0) + 1
    bankSeq.set(day, seq)
    const prefix = intent.channel === 'qris' ? 'QR' : intent.channel === 'va' ? 'VA' : intent.channel === 'bendahara' ? 'BN' : 'BP'
    const reconciled = intent.paidAt.slice(0, 10) < addDays(TODAY, -2) && !ctx.rng.chance(0.02)
    const sspd = openSspd(ctx.db, intent.bill, intent.createdAt, {
      channel: intent.channel,
      paidAt: intent.paidAt,
      bankRef: `${prefix}${day}${String(seq).padStart(5, '0')}`,
      reconciled,
    })
    if (intent.bill.ref.kind === 'ticket') {
      const ticket = ctx.db.tickets.find((t) => t.id === intent.bill.ref.id)
      if (ticket) ticket.sspdId = sspd.id
    }
  }
  ctx.intents.length = 0
}
