import type { Db } from '../db'
import { createRng } from '../rng'
import { seedAssessments, seedSptpd, seedStpd } from './billing'
import { finalizePayments, type Ctx } from './intents'
import { seedBphtb, seedOpsen, seedPbb } from './property'
import { seedPort, seedSkrd, seedTickets } from './retribution'
import { seedRegions, seedRoles, seedSignatories, seedTargets, seedTariffs, seedUsers } from './settings'
import { seedTaxpayers } from './taxpayers'

export function buildDb(): Db {
  const rng = createRng(20261112)
  const db: Db = {
    regions: seedRegions(),
    taxpayers: [],
    taxpayerById: new Map(),
    objects: [],
    objectById: new Map(),
    sptpd: [],
    assessments: [],
    sspd: [],
    stpd: [],
    tickets: [],
    bludCounts: new Map(),
    checkedDays: new Map(),
    vessels: [],
    portBills: [],
    skrd: [],
    wasteSubscribers: [],
    pbbObjects: [],
    sppt: [],
    bphtb: [],
    targets: seedTargets(),
    tariffs: seedTariffs(),
    users: seedUsers(),
    roles: seedRoles(),
    signatories: seedSignatories(),
    counters: new Map(),
  }
  const ctx: Ctx = { db, rng, intents: [], paid: new Set() }

  seedTaxpayers(db, rng)
  seedSptpd(ctx)
  seedAssessments(ctx)
  seedStpd(ctx)
  seedTickets(ctx)
  seedPort(ctx)
  seedSkrd(ctx)
  seedPbb(ctx)
  seedBphtb(ctx)
  seedOpsen(ctx)
  finalizePayments(ctx)

  return db
}
