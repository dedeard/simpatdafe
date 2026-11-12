import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type VesselType = 'kapal_cepat' | 'ferry' | 'liveaboard' | 'speedboat' | 'kapal_barang' | 'kapal_ikan'
export type PortId = 'waisai' | 'saonek' | 'yellu' | 'harapan_jaya'
export type PortService = 'pas_penumpang' | 'tambat' | 'labuh' | 'bongkar_muat' | 'parkir_kendaraan'

export type Vessel = {
  id: string
  name: string
  type: VesselType
  grossTonnage: number
  owner: string
  homePort: string
}

export type PortItem = { service: PortService; quantity: number; unit: string; unitPrice: number; amount: number }

export type PortBill = {
  id: string
  port: PortId
  vesselId?: string
  items: Array<PortItem>
  total: number
  serviceDate: string
  sspdId?: string
  status: 'unpaid' | 'paid'
}

export type PortBillRow = PortBill & { vesselName: string; vesselType?: VesselType }
export type PortStats = { passengersToday: number; vesselsToday: number; amountToday: number; amountYtd: number }
export type VesselRow = Vessel & { visits: number }

export type PortInput = {
  port: PortId
  vesselId?: string
  serviceDate: string
  items: Array<{ service: PortService; quantity: number }>
}

export const PORT_LABEL: Record<PortId, string> = {
  waisai: 'Pelabuhan Waisai',
  saonek: 'Dermaga Saonek',
  yellu: 'Dermaga Yellu',
  harapan_jaya: 'Dermaga Harapan Jaya',
}

export const VESSEL_TYPE_LABEL: Record<VesselType, string> = {
  kapal_cepat: 'Kapal cepat',
  ferry: 'Ferry',
  liveaboard: 'Liveaboard',
  speedboat: 'Speedboat',
  kapal_barang: 'Kapal barang',
  kapal_ikan: 'Kapal ikan',
}

export const SERVICE_META: Record<PortService, { label: string; unit: string }> = {
  pas_penumpang: { label: 'Pas penumpang', unit: 'orang' },
  tambat: { label: 'Jasa tambat', unit: 'GT × etmal' },
  labuh: { label: 'Jasa labuh', unit: 'GT' },
  bongkar_muat: { label: 'Bongkar muat', unit: 'ton' },
  parkir_kendaraan: { label: 'Parkir kendaraan', unit: 'kendaraan' },
}

export const listPortBills = (query: TableQuery): Promise<Page<PortBillRow, PortStats>> => call('port.list', query)
export const getPortBill = (id: string) => call('port.get', id)
export const createPortBill = (input: PortInput) => call('port.create', input)
export const listVessels = (query: TableQuery): Promise<Page<VesselRow>> => call('port.vessels', query)
export const createVessel = (input: Omit<Vessel, 'id'>) => call('port.createVessel', input)
