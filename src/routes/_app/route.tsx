import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks'
import { getBootstrap } from '@/lib/api/resources'
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AccessDenied, AppSidebar } from './-components'
import { requiredPermission } from './-constants'
import { usePermissions } from './-hooks'

export const Route = createFileRoute('/_app')({
  loader: () => getBootstrap(),
  component: AppLayout,
})

function AppLayout() {
  const { resolvedMode } = useTheme()
  const { can } = usePermissions()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const needed = requiredPermission(pathname)
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar className="print:hidden" />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur print:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <span className="text-sm text-muted-foreground">Kabupaten Raja Ampat · Papua Barat Daya</span>
          </header>
          <div className="mx-auto w-full max-w-(--content-width)">
            {needed && !can(needed) ? <AccessDenied permission={needed} /> : <Outlet />}
          </div>
        </SidebarInset>
        <Toaster position="top-right" richColors theme={resolvedMode} />
      </SidebarProvider>
    </TooltipProvider>
  )
}
