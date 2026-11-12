import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { PaymentChannel } from '@/lib/api/resources'
import { cn, formatNumber, formatPercent, formatRupiahCompact } from '@/lib/utils'
import { Cell, Pie, PieChart } from 'recharts'
import { ratio, sum } from '../-utils'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const SWATCHES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

export function PaymentChannelChart({ channels }: { channels: Array<PaymentChannel> }) {
  const total = sum(channels, (c) => c.amount)
  const config = Object.fromEntries(
    channels.map((c, i) => [c.channel, { label: c.label, color: COLORS[i % COLORS.length] }]),
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kanal pembayaran</CardTitle>
        <CardDescription>Bank Papua, VA, QRIS dan bendahara penerima</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={config} className="mx-auto aspect-square h-44">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="channel"
                  hideLabel
                  formatter={(value, _name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{item.payload.label}</span>
                      <span className="font-mono font-medium tabular-nums">{formatRupiahCompact(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Pie data={channels} dataKey="amount" nameKey="channel" innerRadius={48} strokeWidth={4}>
              {channels.map((c, i) => (
                <Cell key={c.channel} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="flex flex-col gap-2 text-sm">
          {channels.map((c, i) => (
            <li key={c.channel} className="flex items-center gap-2">
              <span className={cn('size-2.5 shrink-0 rounded-sm', SWATCHES[i % SWATCHES.length])} />
              <span className="flex-1 truncate">{c.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(c.transactions)} trx</span>
              <span className="w-12 text-right font-medium tabular-nums">{formatPercent(ratio(c.amount, total))}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
