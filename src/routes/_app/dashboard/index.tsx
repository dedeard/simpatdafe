import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDashboard, saveRoleDashboard } from '@/lib/api/resources'
import type { DashboardLayout } from '@/lib/dashboard-widgets'
import { formatDate } from '@/lib/utils'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LayoutGridIcon, Loader2Icon, PlusIcon, RotateCcwIcon, Settings2Icon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePermissions, useSubmit } from '../-hooks'
import { WidgetGrid, WidgetPicker } from './-components'
import { useDashboardLayout, type LayoutSource } from './-hooks'
import { summarize } from './-utils'

export const Route = createFileRoute('/_app/dashboard/')({
  head: () => ({ meta: [{ title: 'Beranda | SIMPATDA Raja Ampat' }] }),
  loader: () => getDashboard(),
  component: DashboardPage,
})

const SOURCE_LABEL: Record<LayoutSource, string> = {
  personal: 'Tata letak pribadi',
  role: 'Bawaan peran',
  auto: 'Bawaan peran',
}

function DashboardPage() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const summary = summarize(data)
  const { can } = usePermissions()
  const { role, layout, roleDefault, source, savePersonal, clearPersonal } = useDashboardLayout()
  const [draft, setDraft] = useState<DashboardLayout | null>(null)
  const [picking, setPicking] = useState(false)
  const { pending, run } = useSubmit()

  const editing = draft !== null
  const shown = draft ?? layout
  const roleName = role?.name ?? '-'

  const finish = () => {
    setDraft(null)
    setPicking(false)
  }

  const saveForRole = () =>
    run(async () => {
      if (!role || !draft) return
      await saveRoleDashboard({ roleId: role.id, layout: draft })
      clearPersonal()
      await router.invalidate()
      toast.success(`Dasbor disimpan sebagai bawaan peran ${roleName}.`)
      finish()
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Beranda</h1>
          <p className="text-sm text-muted-foreground">Ringkasan pendapatan asli daerah dari pajak dan retribusi Kabupaten Raja Ampat</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">TA {data.fiscalYear}</Badge>
          <span>Data per {formatDate(data.asOf, { dateStyle: 'long', timeStyle: 'short' })} WIT</span>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setDraft(layout)}>
              <Settings2Icon />
              Atur dasbor
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-popover/95 p-2 pl-3 shadow-sm backdrop-blur">
          <div className="mr-auto flex min-w-0 flex-col">
            <span className="text-sm font-medium">Mode atur dasbor</span>
            <span className="text-xs text-muted-foreground">Seret widget untuk mengubah urutan, atur ukuran atau hapus dari kartunya.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPicking(true)}>
            <PlusIcon />
            Tambah widget
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDraft(roleDefault)}>
            <RotateCcwIcon />
            Bawaan peran
          </Button>
          <Button variant="ghost" size="sm" onClick={finish} disabled={pending}>
            Batal
          </Button>
          {can('roles.update') && (
            <Button variant="outline" size="sm" disabled={pending || shown.length === 0} onClick={saveForRole}>
              {pending ? <Loader2Icon className="animate-spin" /> : <UsersIcon />}
              Simpan untuk peran {roleName}
            </Button>
          )}
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              savePersonal(shown)
              toast.success('Tata letak dasbor disimpan untuk Anda.')
              finish()
            }}
          >
            Simpan
          </Button>
        </div>
      ) : (
        <div className="-mt-2 flex items-center gap-2 text-xs text-muted-foreground md:-mt-4">
          <LayoutGridIcon className="size-3.5" />
          {SOURCE_LABEL[source]} {source !== 'personal' && <span className="font-medium text-foreground">{roleName}</span>}
          {source === 'personal' && (
            <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={clearPersonal}>
              Kembalikan bawaan peran
            </button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <LayoutGridIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Dasbor kosong</p>
              <p className="text-sm text-muted-foreground">
                {editing ? 'Tambahkan widget yang tersedia untuk peran Anda.' : 'Klik Atur dasbor untuk menambahkan widget.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => (editing ? setPicking(true) : setDraft([]))}>
              <PlusIcon />
              Tambah widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <WidgetGrid layout={shown} context={{ data, summary }} editing={editing} onChange={setDraft} />
      )}

      <WidgetPicker
        open={picking}
        onOpenChange={setPicking}
        layout={shown}
        can={can}
        roleName={roleName}
        onAdd={(widget) => setDraft([...shown, { id: widget.id, size: widget.defaultSize }])}
      />
    </div>
  )
}
