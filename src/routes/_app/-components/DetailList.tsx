import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DetailItem = { label: string; value: React.ReactNode; wide?: boolean }

export function DetailList({ items, columns = 2, className }: { items: Array<DetailItem>; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4 text-sm',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn('flex flex-col gap-0.5', item.wide && 'sm:col-span-full')}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="font-medium break-words">{item.value ?? '-'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DetailCard({
  title,
  description,
  items,
  columns,
  children,
  action,
}: {
  title: string
  description?: string
  items?: Array<DetailItem>
  columns?: 1 | 2 | 3
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">{action}</div>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items && <DetailList items={items} columns={columns} />}
        {children}
      </CardContent>
    </Card>
  )
}
