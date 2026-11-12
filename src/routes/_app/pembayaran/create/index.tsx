import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { BILL_KIND_LABEL, PAYABLE_KINDS, createPaymentCode, listBills, type BillKind, type BillOption } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { cn, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FormSection, PageHeader, SelectField, SummaryCard, TextField } from '../../-components'
import { useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/pembayaran/create/')({
  head: () => ({ meta: [{ title: 'Buat kode bayar | SIMPATDA Raja Ampat' }] }),
  component: CreatePaymentCodePage,
})

function CreatePaymentCodePage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<BillKind>('sptpd')
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<Array<BillOption>>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<BillOption | null>(null)
  const [localError, setLocalError] = useState<string>()
  const { pending, error, run } = useSubmit()

  useEffect(() => {
    let cancelled = false
    const id = setTimeout(async () => {
      setLoading(true)
      const found = await listBills({ kind, q })
      if (!cancelled) {
        setOptions(found)
        setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [kind, q])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Buat kode bayar"
        description="Pilih tagihan yang belum dibayar. Kode bayar berlaku 7 hari."
        back={{ to: '/pembayaran', label: 'Daftar pembayaran' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {(error || localError) && <FormAlert>{error ?? localError}</FormAlert>}
          <FormSection title="Pilih tagihan">
            <SelectField
              label="Jenis tagihan"
              required
              value={kind}
              onChange={(v) => {
                setKind(v as BillKind)
                setSelected(null)
              }}
              options={PAYABLE_KINDS.map((k) => ({ value: k, label: BILL_KIND_LABEL[k] }))}
            />
            <TextField label="Cari dokumen / penyetor" value={q} onChange={setQ} placeholder="No. dokumen atau nama" />
            <div className="sm:col-span-2">
              <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border p-1" aria-label="Daftar tagihan">
                {options.map((o) => (
                  <li key={o.ref.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-muted',
                        selected?.ref.id === o.ref.id && 'bg-primary/10 ring-1 ring-primary',
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{o.payerName}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground">{o.label}</span>
                      </span>
                      <span className="tabular-nums">{formatRupiah(o.amount)}</span>
                    </button>
                  </li>
                ))}
                {!loading && options.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada tagihan yang dapat dibayar.</li>
                )}
              </ul>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  if (!selected) {
                    setLocalError('Pilih tagihan terlebih dahulu.')
                    return
                  }
                  setLocalError(undefined)
                  const code = await createPaymentCode(selected.ref)
                  toast.success(`Kode bayar ${code.paymentCode} dibuat.`)
                  await navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Buat kode bayar
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Tagihan terpilih"
          rows={[
            { label: 'Penyetor', value: selected?.payerName ?? '-' },
            { label: 'Dokumen', value: selected?.label ?? '-' },
            { label: 'Masa berlaku', value: '7 hari' },
          ]}
          total={{ label: 'Jumlah', value: selected ? formatRupiah(selected.amount) : '-' }}
        />
      </div>
    </div>
  )
}
