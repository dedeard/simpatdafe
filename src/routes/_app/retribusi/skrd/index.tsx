import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  SKRD_CODES,
  SKRD_STATUS_LABEL,
  issueWasteRun,
  listSkrd,
  previewWasteRun,
  revenueName,
  type SkrdRow,
  type WasteRunPreview,
} from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon, RecycleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Can, DataTable, DateField, PageHeader, SKRD_STATUS_MAP, StatCard, StatGrid, StatusBadge, type Column } from '../../-components'
import { useSubmit } from '../../-hooks'
import { parseTableSearch, toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/retribusi/skrd/')({
  head: () => ({ meta: [{ title: 'Retribusi lainnya | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listSkrd(deps),
  component: SkrdPage,
})

const columns: Array<Column<SkrdRow>> = [
  {
    header: 'No. SKRD',
    cell: (s) => (
      <Link to="/retribusi/skrd/$id" params={{ id: toSlug(s.id) }} className="font-mono text-xs hover:underline">
        {s.id}
      </Link>
    ),
  },
  {
    header: 'Penyetor',
    cell: (s) => (
      <div className="flex flex-col">
        <span className="font-medium">{s.payerName}</span>
        <span className="text-xs text-muted-foreground">{s.retributionName}</span>
      </div>
    ),
  },
  { header: 'Periode', cell: (s) => (s.period.length === 7 ? monthLabel(s.period) : formatDate(s.period)), hideBelow: 'md' },
  { header: 'Jatuh tempo', cell: (s) => formatDate(s.dueDate), hideBelow: 'lg' },
  { header: 'Total', cell: (s) => formatRupiah(s.total), align: 'right' },
  { header: 'Status', cell: (s) => <StatusBadge status={s.status} map={SKRD_STATUS_MAP} /> },
]

function WasteRunDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState('2026-11')
  const [preview, setPreview] = useState<WasteRunPreview | null>(null)
  const { pending, error, run } = useSubmit()

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RecycleIcon />
        Terbitkan SKRD bulanan
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setPreview(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penerbitan SKRD persampahan bulanan</DialogTitle>
            <DialogDescription>
              Satu SKRD untuk setiap pelanggan aktif. Pelanggan yang sudah memiliki SKRD pada bulan itu dilewati.
            </DialogDescription>
          </DialogHeader>
          {error && <FormAlert>{error}</FormAlert>}
          <DateField
            label="Periode"
            type="month"
            value={period}
            onChange={(v) => {
              setPeriod(v)
              setPreview(null)
            }}
          />
          {preview && (
            <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <dt className="text-muted-foreground">Pelanggan aktif</dt>
              <dd className="text-right tabular-nums">{formatNumber(preview.subscribers)}</dd>
              <dt className="text-muted-foreground">Sudah diterbitkan</dt>
              <dd className="text-right tabular-nums">{formatNumber(preview.alreadyIssued)}</dd>
              <dt className="font-medium">Akan diterbitkan</dt>
              <dd className="text-right font-medium tabular-nums">{formatNumber(preview.toIssue)}</dd>
              <dt className="font-medium">Total nilai</dt>
              <dd className="text-right font-medium tabular-nums">{formatRupiah(preview.total)}</dd>
            </dl>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending || !period}
              onClick={() => run(async () => setPreview(await previewWasteRun(period)))}
            >
              Pratinjau
            </Button>
            <Button
              disabled={pending || !preview || preview.toIssue === 0}
              onClick={() =>
                run(async () => {
                  const result = await issueWasteRun(period)
                  toast.success(`${formatNumber(result.count)} SKRD diterbitkan (${formatRupiah(result.total)}).`)
                  setOpen(false)
                  setPreview(null)
                  await router.invalidate()
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SkrdPage() {
  const data = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Retribusi lainnya (SKRD)"
        description="Persampahan, persetujuan bangunan gedung (PBG), dan pemakaian kekayaan daerah."
        actions={
          <>
            <WasteRunDialog />
            <Can permission="retributions.create">
              <Button nativeButton={false} render={<Link to="/retribusi/skrd/create" />}>
                <PlusIcon />
                Buat SKRD
              </Button>
            </Can>
          </>
        }
      />
      <StatGrid className="xl:grid-cols-3">
        <StatCard label="SKRD terbit" value={formatNumber(data.stats.issued)} />
        <StatCard label="Total nilai" value={formatRupiahCompact(data.stats.total)} />
        <StatCard label="Jatuh tempo" value={formatNumber(data.stats.overdue)} tone={data.stats.overdue > 0 ? 'danger' : 'default'} />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(s) => s.id}
        searchPlaceholder="Cari no. SKRD atau penyetor…"
        rowClassName={(s) => (s.status === 'overdue' ? 'bg-destructive/5' : undefined)}
        filters={[
          { key: 'code', label: 'Jenis retribusi', options: SKRD_CODES.map((c) => ({ value: c, label: revenueName(c) })) },
          { key: 'status', label: 'Status', options: toOptions(SKRD_STATUS_LABEL) },
        ]}
      />
    </div>
  )
}
