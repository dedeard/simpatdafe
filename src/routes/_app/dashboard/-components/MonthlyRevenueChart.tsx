import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { MonthlyRevenue } from '@/lib/api/resources'
import { formatRupiahCompact } from '@/lib/utils'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

const config = {
  pajak: { label: 'Pajak daerah', color: 'var(--chart-1)' },
  retribusi: { label: 'Retribusi daerah', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function MonthlyRevenueChart({ data, fiscalYear }: { data: Array<MonthlyRevenue>; fiscalYear: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penerimaan bulanan</CardTitle>
        <CardDescription>Pajak dan retribusi TA {fiscalYear}. Puncak musim wisata Oktober–April.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-72 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(value: number) => formatRupiahCompact(value)} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{config[name as keyof typeof config]?.label}</span>
                      <span className="font-mono font-medium tabular-nums">{formatRupiahCompact(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="pajak" stackId="total" fill="var(--color-pajak)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="retribusi" stackId="total" fill="var(--color-retribusi)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
