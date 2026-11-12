import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { USE_LABEL, createPaymentCode, getPbbObject } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { FileTextIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DetailCard, DocFields, DocumentPreview, PageHeader, SPPT_STATUS_MAP, StatusBadge } from '../../-components'

export const Route = createFileRoute('/_app/pbb/$nop/')({
  loader: ({ params }) => getPbbObject(params.nop),
  head: ({ params }) => ({ meta: [{ title: `${params.nop} | SIMPATDA Raja Ampat` }] }),
  component: PbbObjectPage,
})

function PbbObjectPage() {
  const { object: o, sppt } = Route.useLoaderData()
  const router = useRouter()
  const [showDoc, setShowDoc] = useState(false)
  const current = sppt[0]

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={o.ownerName}
        description={`NOP ${o.nop}`}
        back={{ to: '/pbb', label: 'Daftar objek' }}
        actions={
          <>
            {current && (current.status === 'issued' || current.status === 'overdue') && current.amount > 0 && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode({ kind: 'sppt', id: `${o.nop}@${current.year}` })
                  toast.success(`Kode bayar: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <WalletIcon />
                Buat kode bayar {current.year}
              </Button>
            )}
            {current && (
              <Button variant="outline" onClick={() => setShowDoc(!showDoc)}>
                <FileTextIcon />
                {showDoc ? 'Tutup SPPT' : 'Pratinjau SPPT'}
              </Button>
            )}
          </>
        }
      />

      {showDoc && current ? (
        <DocumentPreview
          title={`Surat Pemberitahuan Pajak Terutang PBB-P2 ${current.year}`}
          number={`${o.nop}/${current.year}`}
          signatory="sppt"
          stamp={current.status === 'paid' ? 'Telah dibayar' : undefined}
        >
          <DocFields
            rows={[
              ['NOP', o.nop],
              ['Nama wajib pajak', o.ownerName],
              ['Alamat wajib pajak', o.ownerAddress],
              ['Letak objek pajak', `${o.objectAddress}`],
              ['Luas tanah / bangunan', `${formatNumber(o.landArea)} m² / ${formatNumber(o.buildingArea)} m²`],
              ['NJOP', formatRupiah(current.njop)],
              ['NJOPTKP', formatRupiah(current.njoptkp)],
              ['NJKP', formatRupiah(current.njkp)],
              ['Tarif', `${current.rate}%`],
              ['PBB-P2 yang harus dibayar', formatRupiah(current.amount)],
              ['Jatuh tempo', formatDate(current.dueDate, { dateStyle: 'long' })],
            ]}
          />
        </DocumentPreview>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard
            title="Objek pajak"
            items={[
              { label: 'Pemilik', value: o.ownerName },
              { label: 'NIK', value: <span className="font-mono">{o.ownerNik}</span> },
              { label: 'Alamat pemilik', value: o.ownerAddress, wide: true },
              { label: 'Letak objek', value: `${o.objectAddress}`, wide: true },
              { label: 'Penggunaan', value: USE_LABEL[o.use] },
              { label: 'Distrik / kampung', value: `${o.distrik} / ${o.kampung}` },
            ]}
          />
          <DetailCard
            title="Rincian nilai"
            items={[
              { label: 'Luas tanah', value: `${formatNumber(o.landArea)} m²` },
              { label: `Kelas tanah ${o.landClass}`, value: `${formatRupiah(o.landValuePerM2)} / m²` },
              { label: 'Luas bangunan', value: `${formatNumber(o.buildingArea)} m²` },
              { label: `Kelas bangunan ${o.buildingClass}`, value: `${formatRupiah(o.buildingValuePerM2)} / m²` },
              { label: 'NJOP total', value: <span className="text-base">{formatRupiah(o.njop)}</span>, wide: true },
            ]}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat SPPT</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Tahun</TableHead>
                  <TableHead className="text-right">NJOP</TableHead>
                  <TableHead className="text-right">PBB-P2</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sppt.map((s) => (
                  <TableRow key={s.year}>
                    <TableCell className="pl-6">{s.year}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(s.njop)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(s.amount)}</TableCell>
                    <TableCell className="pr-6">
                      <StatusBadge status={s.status} map={SPPT_STATUS_MAP} />
                    </TableCell>
                  </TableRow>
                ))}
                {sppt.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      Belum ada SPPT. Terbit pada penetapan massal berikutnya.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat kepemilikan</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3 border-l pl-4 text-sm">
              {[...o.ownershipHistory].reverse().map((h, i) => (
                <li key={`${h.from}-${i}`} className="relative flex flex-col">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-primary" />
                  <span className="font-medium">{h.owner}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(h.from)} ·{' '}
                    {h.source.includes('BPHTB') ? (
                      <Link to="/bphtb" search={{ q: h.source.split('· ')[1] }} className="hover:underline">
                        {h.source}
                      </Link>
                    ) : (
                      h.source
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
