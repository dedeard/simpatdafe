import { call } from '../rpc'
import type { Role } from './access'
import type { Distrik } from './reference'

export type Tariff = {
  id: string
  key: string
  group: string
  name: string
  unit: string
  value: number
  validFrom: string
  legalBasis: string
}

export type RevenueTarget = { year: number; code: string; target: number; revised?: number }

export type AppUser = {
  id: string
  name: string
  email: string
  roleId: string
  post?: string
  status: 'active' | 'inactive'
}

export type Signatory = { kind: string; label: string; title: string; name: string; nip: string }

export type AppBootstrap = {
  regions: Array<Distrik>
  tariffs: Array<Tariff>
  signatories: Array<Signatory>
  users: Array<AppUser>
  roles: Array<Role>
}

export type TariffInput = { key: string; value: number; validFrom: string; legalBasis: string }
export type RegionInput = { level: 'distrik' | 'kampung'; id?: string; parentId?: string; code: string; name: string }
export type UserInput = Omit<AppUser, 'id'> & { id?: string }

export const getBootstrap = () => call('settings.bootstrap')
export const getTargets = (year: number) => call('settings.targets', year)
export const saveTargets = (input: { year: number; items: Array<{ code: string; target: number; revised?: number }> }) =>
  call('settings.saveTargets', input)
export const addTariffVersion = (input: TariffInput) => call('settings.addTariff', input)
export const saveRegion = (input: RegionInput) => call('settings.saveRegion', input)
export const saveUser = (input: UserInput) => call('settings.saveUser', input)
export const saveSignatory = (input: Signatory) => call('settings.saveSignatory', input)
