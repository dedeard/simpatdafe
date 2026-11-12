import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TourismRetribution } from '@/lib/api/resources'
import { formatNumber, formatPercent, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { GlobeIcon, MapPinIcon, TriangleAlertIcon } from 'lucide-react'
import { ratio } from '../-utils'

export function TourismRetributionCard({ tourism }: { tourism: TourismRetribution }) {
  const visitors = tourism.domestic + tourism.foreign
  const gap = tourism.uptdCount - tourism.bludCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retribusi tanda masuk wisata</CardTitle>
        <CardDescription>Bagian kabupaten {formatRupiah(tourism.ratePerVisitor)} per wisatawan (UPTD Dinas Pariwisata)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{formatNumber(visitors)}</div>
            <div className="text-xs text-muted-foreground">wisatawan tercatat tahun berjalan</div>
          </div>
          <div className="text-right">
            <div className="font-medium tabular-nums">{formatRupiahCompact(visitors * tourism.ratePerVisitor)}</div>
            <div className="text-xs text-muted-foreground">retribusi diterima</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-md border p-2">
            <GlobeIcon className="size-4 text-chart-2" />
            <div>
              <div className="font-medium tabular-nums">{formatNumber(tourism.foreign)}</div>
              <div className="text-xs text-muted-foreground">Mancanegara · {formatPercent(ratio(tourism.foreign, visitors))}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-2">
            <MapPinIcon className="size-4 text-chart-1" />
            <div>
              <div className="font-medium tabular-nums">{formatNumber(tourism.domestic)}</div>
              <div className="text-xs text-muted-foreground">Domestik · {formatPercent(ratio(tourism.domestic, visitors))}</div>
            </div>
          </div>
        </div>
        {gap !== 0 && (
          <div role="status" className="flex gap-2 rounded-md border border-chart-3/40 bg-chart-3/10 p-3 text-sm">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-chart-3" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Rekonsiliasi data kunjungan</span>
              <span className="text-xs text-muted-foreground">
                UPTD kabupaten {formatNumber(tourism.uptdCount)} vs BLUD KKP provinsi {formatNumber(tourism.bludCount)}. Selisih{' '}
                {formatNumber(Math.abs(gap))} wisatawan perlu dicocokkan sebelum laporan triwulan.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
