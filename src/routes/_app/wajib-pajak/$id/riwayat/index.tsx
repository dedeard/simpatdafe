import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTaxpayerHistory } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { ASSESSMENT_STATUS_MAP, SPTPD_STATUS_MAP, SSPD_STATUS_MAP, STPD_STATUS_MAP, StatusBadge } from '../../../-components'

export const Route = createFileRoute('/_app/wajib-pajak/$id/riwayat/')({
  loader: ({ params }) => getTaxpayerHistory(params.id),
  component: HistoryPage,
})

function Section({
  title,
  description,
  empty,
  children,
}: {
  title: string
  description: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {empty ? <p className="px-6 pb-2 text-sm text-muted-foreground">Belum ada data.</p> : <Table>{children}</Table>}
      </CardContent>
    </Card>
  )
}

function HistoryPage() {
  const h = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4">
      <Section title="SPTPD" description="30 laporan terakhir" empty={h.sptpd.length === 0}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Dokumen</TableHead>
            <TableHead>Masa</TableHead>
            <TableHead className="text-right">Pajak</TableHead>
            <TableHead className="pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {h.sptpd.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="pl-6">
                <div className="flex flex-col">
                  <span className="font-mono text-xs">{s.id}</span>
                  <span className="text-xs text-muted-foreground">{s.taxName}</span>
                </div>
              </TableCell>
              <TableCell>{monthLabel(s.period)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(s.taxDue)}</TableCell>
              <TableCell className="pr-6">
                <div className="flex gap-1">
                  <StatusBadge status={s.status} map={SPTPD_STATUS_MAP} />
                  {s.paid && <StatusBadge status="paid" map={SSPD_STATUS_MAP} />}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>
      <Section title="Ketetapan" description="SKPD dan SKPDKB" empty={h.assessments.length === 0}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Dokumen</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {h.assessments.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="pl-6">
                <div className="flex flex-col">
                  <span className="font-mono text-xs">{a.id}</span>
                  <span className="text-xs text-muted-foreground">{a.taxName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(a.total)}</TableCell>
              <TableCell className="pr-6">
                <StatusBadge status={a.status} map={ASSESSMENT_STATUS_MAP} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>
      <Section title="Pembayaran" description="30 SSPD terakhir" empty={h.payments.length === 0}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">SSPD</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Dibayar</TableHead>
            <TableHead className="pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {h.payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-6">
                <div className="flex flex-col">
                  <span className="font-mono text-xs">{p.id}</span>
                  <span className="text-xs text-muted-foreground">{p.revenue}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(p.amount)}</TableCell>
              <TableCell>{p.paidAt ? formatDateTime(p.paidAt) : '-'}</TableCell>
              <TableCell className="pr-6">
                <StatusBadge status={p.status} map={SSPD_STATUS_MAP} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>
      <Section title="Penagihan" description="STPD yang pernah diterbitkan" empty={h.stpd.length === 0}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">STPD</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {h.stpd.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="pl-6 font-mono text-xs">{s.id}</TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(s.total)}</TableCell>
              <TableCell className="pr-6">
                <StatusBadge status={s.status} map={STPD_STATUS_MAP} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>
    </div>
  )
}
