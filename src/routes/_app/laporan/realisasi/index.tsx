import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getRealisasi, type RealisasiRow } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { formatPercent, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReportSheet } from '../-components/ReportSheet'
import { downloadCsv } from '../-utils'
import { PageHeader, SelectField } from '../../-components'

export const Route = createFileRoute('/_app/laporan/realisasi/')({
  head: () => ({ meta: [{ title: 'Laporan realisasi | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    year: Number(search.year) === 2025 ? 2025 : 2026,
    month: Math.min(Math.max(Number(search.month) || 11, 1), 12),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getRealisasi(deps),
  component: RealisasiPage,
})

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: monthLabel(`2026-${String(i + 1).padStart(2, '0')}`).split(' ')[0],
}))

type Subtotal = { target: number; previous: number; current: number; cumulative: number }
const zero = (): Subtotal => ({ target: 0, previous: 0, current: 0, cumulative: 0 })
const add = (a: Subtotal, r: Subtotal): Subtotal => ({
  target: a.target + r.target,
  previous: a.previous + r.previous,
  current: a.current + r.current,
  cumulative: a.cumulative + r.cumulative,
})

function Cells({ row, bold }: { row: Subtotal; bold?: boolean }) {
  const cls = `text-right tabular-nums ${bold ? 'font-semibold' : ''}`
  return (
    <>
      <TableCell className={cls}>{formatRupiah(row.target)}</TableCell>
      <TableCell className={`${cls} hidden md:table-cell print:table-cell`}>{formatRupiah(row.previous)}</TableCell>
      <TableCell className={cls}>{formatRupiah(row.current)}</TableCell>
      <TableCell className={cls}>{formatRupiah(row.cumulative)}</TableCell>
      <TableCell className={cls}>{formatPercent(row.target ? row.cumulative / row.target : 0)}</TableCell>
      <TableCell className={`${cls} hidden lg:table-cell print:table-cell`}>
        {formatRupiah(Math.max(row.target - row.cumulative, 0))}
      </TableCell>
    </>
  )
}

function RealisasiPage() {
  const report = Route.useLoaderData()
  const navigate = useNavigate()
  const groups = [...new Set(report.rows.map((r) => r.category))].map((category) => {
    const rows = report.rows.filter((r) => r.category === category)
    return { category, rows, total: rows.reduce<Subtotal>(add, zero()) }
  })
  const grand = groups.reduce<Subtotal>((a, g) => add(a, g.total), zero())

  const csv = () =>
    downloadCsv(`realisasi-${report.year}-${String(report.month).padStart(2, '0')}.csv`, [
      ['Kode rekening', 'Uraian', 'Kelompok', 'Target', 's.d. bulan lalu', 'Bulan ini', 's.d. bulan ini', 'Persen', 'Sisa target'],
      ...report.rows.map((r: RealisasiRow) => [
        r.code,
        r.name,
        r.group,
        r.target,
        r.previous,
        r.current,
        r.cumulative,
        r.target ? Number((r.cumulative / r.target).toFixed(4)) : 0,
        Math.max(r.target - r.cumulative, 0),
      ]),
    ])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Laporan realisasi"
        description="Target dan realisasi pendapatan asli daerah per kode rekening, dihitung dari SSPD yang sudah dibayar."
      />
      <div className="flex flex-wrap gap-3 print:hidden">
        <SelectField
          className="w-32"
          label="Tahun"
          value={String(report.year)}
          onChange={(v) => navigate({ to: '.', search: { year: Number(v), month: report.month } })}
          options={[
            { value: '2026', label: '2026' },
            { value: '2025', label: '2025' },
          ]}
          placeholder="Tahun"
        />
        <SelectField
          className="w-40"
          label="Sampai bulan"
          value={String(report.month)}
          onChange={(v) => navigate({ to: '.', search: { year: report.year, month: Number(v) } })}
          options={MONTHS}
          placeholder="Bulan"
        />
      </div>
      {report.year === 2025 && (
        <p className="text-sm text-muted-foreground print:hidden">Data demo 2025 hanya memuat target. Realisasi tersedia untuk 2026.</p>
      )}
      <ReportSheet
        title="Laporan realisasi penerimaan pajak dan retribusi daerah"
        period={`Tahun ${report.year}, sampai ${MONTHS[report.month - 1].label} ${report.year}`}
        onCsv={csv}
      >
        <div className="overflow-x-auto">
          <Table className="print:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Uraian</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="hidden text-right md:table-cell print:table-cell">s.d. bulan lalu</TableHead>
                <TableHead className="text-right">Bulan ini</TableHead>
                <TableHead className="text-right">s.d. bulan ini</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="hidden text-right lg:table-cell print:table-cell">Sisa target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <GroupRows
                  key={g.category}
                  label={g.category === 'pajak' ? 'Pajak daerah' : 'Retribusi daerah'}
                  rows={g.rows}
                  total={g.total}
                />
              ))}
              <TableRow className="bg-muted/60">
                <TableCell className="font-semibold">Total PAD</TableCell>
                <Cells row={grand} bold />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </ReportSheet>
    </div>
  )
}

function GroupRows({ label, rows, total }: { label: string; rows: Array<RealisasiRow>; total: Subtotal }) {
  return (
    <>
      <TableRow className="bg-muted/30">
        <TableCell colSpan={7} className="font-semibold">
          {label}
        </TableCell>
      </TableRow>
      {rows.map((r) => (
        <TableRow key={r.code}>
          <TableCell>
            <div className="flex flex-col">
              <span>{r.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
            </div>
          </TableCell>
          <Cells row={r} />
        </TableRow>
      ))}
      <TableRow>
        <TableCell className="font-medium">Jumlah {label.toLowerCase()}</TableCell>
        <Cells row={total} bold />
      </TableRow>
    </>
  )
}
