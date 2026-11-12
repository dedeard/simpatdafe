import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DISTRIK, SELF_ASSESSED_CODES, getPerWpReport, revenueName } from '@/lib/api/resources'
import { formatPercent, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReportSheet } from '../-components/ReportSheet'
import { downloadCsv } from '../-utils'
import { PageHeader, SelectField } from '../../-components'
import { useAppData } from '../../-hooks'

export const Route = createFileRoute('/_app/laporan/per-wp/')({
  head: () => ({ meta: [{ title: 'Laporan per wajib pajak | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    year: Number(search.year) === 2025 ? 2025 : 2026,
    taxCode: typeof search.taxCode === 'string' ? search.taxCode : undefined,
    distrikId: typeof search.distrikId === 'string' ? search.distrikId : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getPerWpReport(deps),
  component: PerWpPage,
})

function PerWpPage() {
  const rows = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { regions } = useAppData()
  const set = (patch: Partial<typeof search>) => navigate({ to: '.', search: { ...search, ...patch } })

  const csv = () =>
    downloadCsv(`per-wp-${search.year}.csv`, [
      ['NPWPD', 'Nama', 'Distrik', 'Dibayar', 'Masa dilaporkan', 'Masa wajib lapor', 'Tunggakan'],
      ...rows.map((r) => [r.npwpd, r.name, r.distrik, r.paid, r.monthsReported, r.monthsDue, r.arrears]),
    ])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Laporan per wajib pajak"
        description="50 wajib pajak dengan pembayaran terbesar, beserta kepatuhan pelaporan dan tunggakan."
      />
      <div className="flex flex-wrap gap-3 print:hidden">
        <SelectField
          className="w-32"
          label="Tahun"
          value={String(search.year)}
          onChange={(v) => set({ year: Number(v) === 2025 ? 2025 : 2026 })}
          options={[
            { value: '2026', label: '2026' },
            { value: '2025', label: '2025' },
          ]}
          placeholder="Tahun"
        />
        <SelectField
          className="w-64"
          label="Jenis pajak"
          value={search.taxCode ?? ''}
          onChange={(v) => set({ taxCode: v || undefined })}
          options={SELF_ASSESSED_CODES.map((c) => ({ value: c, label: revenueName(c) }))}
          placeholder="Semua jenis"
        />
        <SelectField
          className="w-56"
          label="Distrik"
          value={search.distrikId ?? ''}
          onChange={(v) => set({ distrikId: v || undefined })}
          options={(regions.length ? regions : DISTRIK).map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Semua distrik"
        />
      </div>
      <ReportSheet
        title="Laporan pembayaran dan kepatuhan wajib pajak"
        period={`Tahun ${search.year}${search.taxCode ? ` · ${revenueName(search.taxCode)}` : ''}`}
        onCsv={csv}
      >
        <div className="overflow-x-auto">
          <Table className="print:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Wajib pajak</TableHead>
                <TableHead className="hidden md:table-cell print:table-cell">Distrik</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead className="text-right">Kepatuhan lapor</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.taxpayerId}>
                  <TableCell className="tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.npwpd}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell print:table-cell">{r.distrik}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(r.paid)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.monthsDue ? `${r.monthsReported}/${r.monthsDue} (${formatPercent(r.monthsReported / r.monthsDue)})` : '-'}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums ${r.arrears > 0 ? 'text-destructive' : ''}`}>
                    {r.arrears ? formatRupiah(r.arrears) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Tidak ada data untuk filter ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ReportSheet>
    </div>
  )
}
