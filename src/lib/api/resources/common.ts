export type TableQuery = {
  q?: string
  page?: number
  pageSize?: number
  [filter: string]: string | number | undefined
}

export type Page<T, S = undefined> = {
  rows: Array<T>
  total: number
  page: number
  pageSize: number
  stats: S
}

export type Option = { value: string; label: string }

export type BillKind = 'sptpd' | 'skpd' | 'stpd' | 'skrd' | 'sppt' | 'bphtb' | 'port' | 'ticket' | 'opsen'

export type BillRef = { kind: BillKind; id: string }

export type Ok = { ok: true }

export const DEFAULT_PAGE_SIZE = 15
