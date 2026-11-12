import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'default' | 'danger' | 'warning'
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn('text-xl tabular-nums', tone === 'danger' && 'text-destructive', tone === 'warning' && 'text-chart-3')}>
          {value}
        </CardTitle>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardHeader>
    </Card>
  )
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}
