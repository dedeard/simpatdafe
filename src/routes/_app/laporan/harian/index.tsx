import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CHANNEL_LABEL, getDailyReport } from '@/lib/api/resources'
import { formatDate, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReportSheet } from '../-components/ReportSheet'
import { downloadCsv } from '../-utils'
import { DateField, PageHeader, SelectField, StatCard, StatGrid } from '../../-components'
import { toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/laporan/harian/')({
  head: () => ({ meta: [{ title: 'Penerimaan harian | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? search.date : '2026-11-11',
    channel: typeof search.channel === 'string' ? search.channel : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getDailyReport(deps),
  component: DailyPage,
})

function DailyPage() {
  const report = Route.useLoaderData()
  const { channel } = Route.useSearch()
  const navigate = useNavigate()

  const csv = () =>
    downloadCsv(`penerimaan-${report.date}.csv`, [
      ['No. SSPD', 'Penyetor', 'Kode rekening', 'Uraian', 'Kanal', 'Jam', 'Jumlah'],
      ...report.rows.map((s) => [
        s.id,
        s.payerName,
        s.revenueCode,
        s.revenueName,
        s.channel ? CHANNEL_LABEL[s.channel] : '',
        s.paidAt?.slice(11, 16) ?? '',
        s.amount,
      ]),
    ])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader title="Penerimaan harian" description="Buku kas penerimaan: seluruh SSPD yang dibayar pada satu hari." />
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <DateField
          label="Tanggal"
          value={report.date}
          max="2026-11-12"
          onChange={(date) => date && navigate({ to: '.', search: { date, channel } })}
          className="w-44"
        />
        <SelectField
          className="w-52"
          label="Kanal"
          value={channel ?? ''}
          onChange={(v) => navigate({ to: '.', search: { date: report.date, channel: v || undefined } })}
          options={toOptions(CHANNEL_LABEL)}
          placeholder="Semua kanal"
        />
      </div>
      <StatGrid className="print:hidden">
        <StatCard label="Total penerimaan" value={formatRupiah(report.total)} />
        {(['teller', 'va', 'qris'] as const).map((c) => (
          <StatCard key={c} label={CHANNEL_LABEL[c]} value={formatRupiah(report.byChannel[c])} />
        ))}
      </StatGrid>
      <ReportSheet title="Buku penerimaan harian" period={formatDate(report.date, { dateStyle: 'full' })} onCsv={csv}>
        <div className="overflow-x-auto">
          <Table className="print:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>No. SSPD</TableHead>
                <TableHead>Penyetor</TableHead>
                <TableHead className="hidden md:table-cell print:table-cell">Uraian</TableHead>
                <TableHead className="hidden sm:table-cell print:table-cell">Kanal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell>{s.payerName}</TableCell>
                  <TableCell className="hidden md:table-cell print:table-cell">{s.revenueName}</TableCell>
                  <TableCell className="hidden sm:table-cell print:table-cell">{s.channel ? CHANNEL_LABEL[s.channel] : '-'}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(s.amount)}</TableCell>
                </TableRow>
              ))}
              {report.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Tidak ada penerimaan pada tanggal ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Total ({report.rows.length} transaksi)
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatRupiah(report.total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </ReportSheet>
    </div>
  )
}
