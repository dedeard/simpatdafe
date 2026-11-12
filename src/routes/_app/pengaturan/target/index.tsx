import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTargets, saveTargets } from '@/lib/api/resources'
import { formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, SelectField } from '../../-components'
import { useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/target/')({
  head: () => ({ meta: [{ title: 'Target pendapatan | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({ year: Number(search.year) === 2025 ? 2025 : 2026 }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => ({ year: deps.year, items: await getTargets(deps.year) }),
  component: TargetsPage,
})

function MoneyCell({ value, onChange, label }: { value: number | undefined; onChange: (v: number | undefined) => void; label: string }) {
  return (
    <Input
      aria-label={label}
      inputMode="numeric"
      className="w-40 text-right tabular-nums"
      value={value === undefined ? '' : formatNumber(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits === '' ? undefined : Number(digits))
      }}
    />
  )
}

function TargetsPage() {
  const { year, items } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [draft, setDraft] = useState<Record<string, { target: number | undefined; revised: number | undefined }>>(() =>
    Object.fromEntries(items.map((i) => [i.code, { target: i.target, revised: i.revised }])),
  )
  const { pending, error, run } = useSubmit()

  const set = (code: string, patch: Partial<{ target: number | undefined; revised: number | undefined }>) =>
    setDraft({ ...draft, [code]: { ...draft[code], ...patch } })
  const totalTarget = items.reduce((s, i) => s + (draft[i.code]?.target ?? 0), 0)
  const totalRevised = items.reduce((s, i) => s + (draft[i.code]?.revised ?? draft[i.code]?.target ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Target pendapatan"
        description="Target APBD per kode rekening. Target perubahan (APBD-P) menggantikan target awal di laporan bila diisi."
        actions={
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                await saveTargets({
                  year,
                  items: items.map((i) => ({ code: i.code, target: draft[i.code]?.target ?? 0, revised: draft[i.code]?.revised })),
                })
                toast.success('Target disimpan. Dashboard dan laporan memakai nilai baru.')
                await router.invalidate()
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Simpan target
          </Button>
        }
      />
      <SelectField
        className="w-40"
        label="Tahun anggaran"
        value={String(year)}
        onChange={(v) => navigate({ to: '.', search: { year: Number(v) } })}
        options={[
          { value: '2026', label: '2026' },
          { value: '2025', label: '2025' },
        ]}
        placeholder="Tahun"
      />
      {error && <FormAlert>{error}</FormAlert>}
      <Card>
        <CardContent className="px-0">
          <Table key={year}>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Kode rekening</TableHead>
                <TableHead className="text-right">Target awal</TableHead>
                <TableHead className="pr-6 text-right">Target perubahan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.code}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{i.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {i.code} · {i.group}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell label={`Target ${i.name}`} value={draft[i.code]?.target} onChange={(target) => set(i.code, { target })} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <MoneyCell
                      label={`Target perubahan ${i.name}`}
                      value={draft[i.code]?.revised}
                      onChange={(revised) => set(i.code, { revised })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-6 font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatRupiah(totalTarget)}</TableCell>
                <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatRupiah(totalRevised)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
