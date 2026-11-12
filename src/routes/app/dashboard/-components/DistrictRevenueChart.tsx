import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { DistrictRevenue } from '@/lib/api/resources'
import { formatRupiahCompact } from '@/lib/utils'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

const config = { amount: { label: 'Penerimaan pajak', color: 'var(--chart-1)' } } satisfies ChartConfig

export function DistrictRevenueChart({ districts }: { districts: Array<DistrictRevenue> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penerimaan pajak per distrik</CardTitle>
        <CardDescription>Berdasarkan lokasi objek pajak</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-80 w-full">
          <BarChart data={districts} layout="vertical" margin={{ left: 0, right: 56 }}>
            <YAxis dataKey="district" type="category" tickLine={false} axisLine={false} width={150} tick={{ fontSize: 12 }} />
            <XAxis type="number" dataKey="amount" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  formatter={(value) => <span className="font-mono font-medium tabular-nums">{formatRupiahCompact(Number(value))}</span>}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4}>
              <LabelList
                dataKey="amount"
                position="right"
                className="fill-muted-foreground"
                fontSize={11}
                formatter={(value) => formatRupiahCompact(Number(value))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
