import { cn } from '@/lib/utils'
import { Link, type LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

export type SectionTab = {
  to: LinkProps['to']
  label: string
  icon?: LucideIcon
  params?: Record<string, string>
  exact?: boolean
}

type SectionTabsProps = {
  tabs: ReadonlyArray<SectionTab>
  label: string
  className?: string
}

export function SectionTabs({ tabs, label, className }: SectionTabsProps) {
  return (
    <nav aria-label={label} className={cn('no-scrollbar overflow-x-auto print:hidden', className)}>
      <div className="inline-flex min-w-max items-center gap-0.5 rounded-lg bg-muted p-[3px]">
        {tabs.map(({ to, label: text, icon: Icon, params, exact }) => (
          <Link
            key={String(to)}
            to={to}
            params={params as never}
            activeOptions={{ exact: exact ?? false }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-sm dark:text-muted-foreground dark:hover:text-foreground dark:data-[status=active]:border-input dark:data-[status=active]:bg-input/30 dark:data-[status=active]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {Icon && <Icon />}
            {text}
          </Link>
        ))}
      </div>
    </nav>
  )
}
