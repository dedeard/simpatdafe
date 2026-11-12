import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { AddObjectDialog } from '../../-components/AddObjectDialog'
import { useTaxpayer } from '../../-hooks'

export const Route = createFileRoute('/_app/wajib-pajak/$id/objek/')({ component: ObjectsPage })

function ObjectsPage() {
  const { taxpayer, objects } = useTaxpayer()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objek pajak</CardTitle>
        <CardDescription>{objects.length} objek terdaftar atas nama wajib pajak ini.</CardDescription>
        <CardAction>
          <AddObjectDialog taxpayer={taxpayer} />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Objek</TableHead>
              <TableHead>Jenis pajak</TableHead>
              <TableHead className="hidden md:table-cell">Lokasi</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Kapasitas</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Tarif rata-rata</TableHead>
              <TableHead className="pr-6">Pelaporan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center whitespace-normal text-muted-foreground">
                  Belum ada objek pajak.
                </TableCell>
              </TableRow>
            )}
            {objects.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="pl-6 whitespace-normal">
                  <div className="flex flex-col">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.category} · sejak {o.startedAt}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{o.taxName}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {o.kampung}, {o.distrik}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {o.capacity ? formatNumber(o.capacity) : '-'}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {o.averageRate ? formatRupiah(o.averageRate) : '-'}
                </TableCell>
                <TableCell className="pr-6">
                  {o.status === 'inactive' ? (
                    <Badge variant="outline">Tidak aktif</Badge>
                  ) : o.reportingRequired ? (
                    <Badge variant="secondary">Wajib lapor bulanan</Badge>
                  ) : (
                    <Badge variant="outline">Tidak wajib</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
