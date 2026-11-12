import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getReconciliation, markReconciled } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { DateField, PageHeader, StatCard, StatGrid } from '../../-components'

export const Route = createFileRoute('/_app/pembayaran/rekonsiliasi/')({
  head: () => ({ meta: [{ title: 'Rekonsiliasi | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({ date: typeof search.date === 'string' ? search.date : '2026-11-11' }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getReconciliation(deps.date),
  component: ReconciliationPage,
})

function ReconciliationPage() {
  const r = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const unmatchedSspd = r.sspd.filter((s) => !s.matched)
  const unmatchedBank = r.bank.filter((b) => !b.matchedSspdId)
  const difference = r.bankTotal - r.sspdTotal

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Rekonsiliasi"
        description="Cocokkan mutasi rekening Bank Papua dengan SSPD pada tanggal yang dipilih."
        back={{ to: '/pembayaran', label: 'Daftar pembayaran' }}
      />
      <DateField
        label="Tanggal"
        value={r.date}
        max="2026-11-12"
        onChange={(date) => date && navigate({ to: '.', search: { date } })}
        className="w-48"
      />
      <StatGrid>
        <StatCard label="Total mutasi bank" value={formatRupiah(r.bankTotal)} />
        <StatCard label="Total SSPD" value={formatRupiah(r.sspdTotal)} />
        <StatCard label="Selisih" value={formatRupiah(difference)} tone={difference === 0 ? 'default' : 'warning'} />
        <StatCard
          label="Belum cocok"
          value={`${unmatchedSspd.length} SSPD · ${unmatchedBank.length} mutasi`}
          tone={unmatchedSspd.length + unmatchedBank.length > 0 ? 'warning' : 'default'}
        />
      </StatGrid>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mutasi bank</CardTitle>
            <CardDescription>{r.bank.length} baris</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[32rem] overflow-y-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Ref. bank</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.bank.map((b) => (
                  <TableRow key={b.bankRef} className={b.matchedSspdId ? undefined : 'bg-chart-3/10'}>
                    <TableCell className="pl-6 font-mono text-xs">{b.bankRef}</TableCell>
                    <TableCell>{b.time}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(b.amount)}</TableCell>
                    <TableCell className="pr-6">
                      {b.matchedSspdId ? <Badge variant="secondary">Cocok</Badge> : <Badge variant="outline">Tanpa SSPD</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {r.bank.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Tidak ada mutasi pada tanggal ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SSPD</CardTitle>
            <CardDescription>{r.sspd.length} pembayaran (maksimal 400 baris ditampilkan)</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[32rem] overflow-y-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">SSPD</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.sspd.map((s) => (
                  <TableRow key={s.id} className={s.matched ? undefined : 'bg-chart-3/10'}>
                    <TableCell className="pl-6">
                      <Link to="/pembayaran/$id" params={{ id: toSlug(s.id) }} className="flex flex-col hover:underline">
                        <span className="font-mono text-xs">{s.id}</span>
                        <span className="text-xs text-muted-foreground">{s.payerName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(s.amount)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      {s.matched ? (
                        <Badge variant="secondary">Cocok</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await markReconciled(s.id)
                            toast.success('SSPD ditandai cocok.')
                            await router.invalidate()
                          }}
                        >
                          Cocokkan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {r.sspd.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      Tidak ada SSPD pada tanggal ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
