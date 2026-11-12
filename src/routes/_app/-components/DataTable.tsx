import { OptionSelect } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Option } from '@/lib/api/resources'
import { cn, formatNumber } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTableParams } from '../-hooks'

export type Column<T> = {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  align?: 'left' | 'right'
  hideBelow?: 'sm' | 'md' | 'lg'
}

export type TableFilter = { key: string; label: string; options: Array<Option>; width?: string }

type DataTableProps<T> = {
  columns: Array<Column<T>>
  rows: Array<T>
  total: number
  page: number
  pageSize: number
  rowKey: (row: T) => string
  filters?: Array<TableFilter>
  searchPlaceholder?: string
  hideSearch?: boolean
  toolbar?: React.ReactNode
  emptyText?: string
  rowClassName?: (row: T) => string | undefined
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

export function DataTable<T>({
  columns,
  rows,
  total,
  page,
  pageSize,
  rowKey,
  filters = [],
  searchPlaceholder = 'Cari…',
  hideSearch,
  toolbar,
  emptyText = 'Tidak ada data yang cocok dengan filter.',
  rowClassName,
}: DataTableProps<T>) {
  const { search, setParams } = useTableParams()
  const urlQuery = typeof search.q === 'string' ? search.q : ''
  const [draft, setDraft] = useState(urlQuery)
  const lastUrlQuery = useRef(urlQuery)

  useEffect(() => {
    if (draft === lastUrlQuery.current) return
    const id = setTimeout(() => {
      lastUrlQuery.current = draft
      setParams({ q: draft || undefined })
    }, 350)
    return () => clearTimeout(id)
  }, [draft, setParams])

  const pages = Math.max(Math.ceil(total / pageSize), 1)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const active = filters.some((f) => search[f.key] !== undefined) || Boolean(urlQuery)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!hideSearch && (
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
              aria-label="Cari"
            />
          </div>
        )}
        {filters.map((f) => (
          <OptionSelect
            key={f.key}
            className={f.width ?? 'w-full sm:w-48'}
            aria-label={f.label}
            placeholder={`Semua ${f.label.toLowerCase()}`}
            value={search[f.key] === undefined ? '' : String(search[f.key])}
            onChange={(value) => setParams({ [f.key]: value || undefined })}
            options={f.options}
          />
        ))}
        {toolbar}
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft('')
              lastUrlQuery.current = ''
              setParams({ q: undefined, ...Object.fromEntries(filters.map((f) => [f.key, undefined])) })
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.header} className={cn(c.align === 'right' && 'text-right', c.hideBelow && HIDE[c.hideBelow])}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center whitespace-normal text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.header}
                      className={cn(c.align === 'right' && 'text-right tabular-nums', c.hideBelow && HIDE[c.hideBelow], c.className)}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {formatNumber(from)}–{formatNumber(to)} dari {formatNumber(total)} data
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)}>
            <ChevronLeftIcon />
            Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page} / {formatNumber(pages)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)}>
            Berikutnya
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
