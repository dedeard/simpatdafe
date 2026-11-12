import { Button } from '@/components/ui/button'
import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

type PageHeaderProps = {
  title: string
  description?: string
  back?: { to: LinkProps['to']; params?: Record<string, string>; label?: string }
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export function PageHeader({ title, description, back, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 print:hidden">
      {back && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          nativeButton={false}
          render={<Link to={back.to} params={back.params as never} />}
        >
          <ArrowLeftIcon />
          {back.label ?? 'Kembali'}
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
