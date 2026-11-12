import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { BPHTB_TYPE_LABEL, PPAT_LIST, REQUIRED_ATTACHMENTS, createBphtb, lookupNop, type BphtbType } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { bphtbCalc } from '@/lib/tax'
import { cn, formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon, SearchIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormSection, MoneyField, PageHeader, SelectField, SummaryCard, TextField } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'
import { digitsOnly, toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/bphtb/create/')({
  head: () => ({ meta: [{ title: 'Ajukan BPHTB | SIMPATDA Raja Ampat' }] }),
  component: CreateBphtbPage,
})

type NopResult = Awaited<ReturnType<typeof lookupNop>>[number]

function CreateBphtbPage() {
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<NopResult>>([])
  const [nop, setNop] = useState<NopResult | null>(null)
  const [type, setType] = useState<BphtbType | ''>('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerNik, setBuyerNik] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [ppat, setPpat] = useState('')
  const [price, setPrice] = useState<number | undefined>()
  const [attachments, setAttachments] = useState<Array<string>>([])
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const calc = bphtbCalc({ price: price ?? 0, njop: nop?.njop ?? 0, transactionType: type || 'jual_beli' }, tariffs, TODAY)

  const search = async (value: string) => {
    setQuery(value)
    setResults(value.trim().length >= 3 ? await lookupNop(value) : [])
  }

  const pickNop = (n: NopResult) => {
    setNop(n)
    setResults([])
    setQuery('')
    setSellerName(n.ownerName)
  }

  const submit = () =>
    run(async () => {
      const e: Record<string, string> = {}
      if (!nop) e.nop = 'Cari dan pilih NOP.'
      if (!type) e.type = 'Pilih jenis transaksi.'
      if (!buyerName.trim()) e.buyerName = 'Nama pembeli wajib diisi.'
      if (!/^\d{16}$/.test(buyerNik)) e.buyerNik = 'NIK harus 16 digit.'
      if (!sellerName.trim()) e.sellerName = 'Nama penjual wajib diisi.'
      if (type && type !== 'waris' && !ppat) e.ppat = 'Pilih PPAT.'
      if (!price || price <= 0) e.price = 'Harga transaksi harus lebih dari 0.'
      const missing = REQUIRED_ATTACHMENTS.filter((a) => !attachments.includes(a))
      if (missing.length > 0) e.attachments = `Lampiran wajib belum lengkap: ${missing.join(', ')}.`
      setErrors(e)
      if (Object.keys(e).length > 0 || !nop || !type || !price) return
      const result = await createBphtb({
        nop: nop.nop,
        transactionType: type,
        buyer: { name: buyerName, nik: buyerNik, address: buyerAddress },
        seller: { name: sellerName },
        ppat: ppat || undefined,
        declaredPrice: price,
        attachments,
      })
      toast.success('Pengajuan BPHTB dibuat.')
      await navigate({ to: '/bphtb/$id', params: { id: toSlug(result.id) } })
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Ajukan BPHTB"
        description="Pilih objek pajak, isi data transaksi, dan lampirkan dokumen. Pengajuan masuk antrean verifikasi."
        back={{ to: '/bphtb', label: 'Daftar BPHTB' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          <FormSection title="Objek pajak (NOP)">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Field data-invalid={Boolean(errors.nop)}>
                <FieldLabel htmlFor="nop-search">Cari NOP atau nama pemilik</FieldLabel>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nop-search"
                    className="pl-8"
                    value={query}
                    onChange={(e) => search(e.target.value)}
                    placeholder="Ketik minimal 3 karakter"
                    aria-invalid={Boolean(errors.nop)}
                  />
                </div>
                {errors.nop && <span className="text-sm text-destructive">{errors.nop}</span>}
              </Field>
              {results.length > 0 && (
                <ul className="flex max-h-60 flex-col overflow-y-auto rounded-lg border p-1">
                  {results.map((r) => (
                    <li key={r.nop}>
                      <button
                        type="button"
                        className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-muted"
                        onClick={() => pickNop(r)}
                      >
                        <span className="font-medium">{r.ownerName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{r.nop}</span>
                        <span className="text-xs text-muted-foreground">{r.address}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {nop && (
                <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm">
                  <div className="font-mono text-xs">{nop.nop}</div>
                  <div className="font-medium">{nop.ownerName}</div>
                  <div className="text-muted-foreground">
                    {nop.address} · tanah {formatNumber(nop.landArea)} m², bangunan {formatNumber(nop.buildingArea)} m² · NJOP{' '}
                    {formatRupiah(nop.njop)}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
          <FormSection title="Transaksi">
            <SelectField
              label="Jenis transaksi"
              required
              value={type}
              error={errors.type}
              onChange={(v) => setType(v as BphtbType)}
              options={toOptions(BPHTB_TYPE_LABEL)}
            />
            <SelectField
              label="PPAT / notaris"
              required={type !== 'waris'}
              value={ppat}
              error={errors.ppat}
              onChange={setPpat}
              options={PPAT_LIST.map((p) => ({ value: p, label: p }))}
            />
            <MoneyField className="sm:col-span-2" label="Harga transaksi" required value={price} error={errors.price} onChange={setPrice} />
          </FormSection>
          <FormSection title="Pihak">
            <TextField label="Nama pembeli" required value={buyerName} error={errors.buyerName} onChange={setBuyerName} />
            <TextField
              label="NIK pembeli"
              required
              inputMode="numeric"
              maxLength={16}
              value={buyerNik}
              error={errors.buyerNik}
              onChange={(v) => setBuyerNik(digitsOnly(v))}
            />
            <TextField className="sm:col-span-2" label="Alamat pembeli" value={buyerAddress} onChange={setBuyerAddress} />
            <TextField
              className="sm:col-span-2"
              label="Nama penjual / pemberi"
              required
              value={sellerName}
              error={errors.sellerName}
              onChange={setSellerName}
            />
          </FormSection>
          <FormSection title="Lampiran wajib" description="Centang dokumen yang sudah diterima (hanya nama berkas yang disimpan).">
            <div className={cn('flex flex-col gap-2 sm:col-span-2', errors.attachments && 'rounded-lg border border-destructive p-3')}>
              {REQUIRED_ATTACHMENTS.map((a) => (
                <Field key={a} orientation="horizontal">
                  <Checkbox
                    id={a}
                    checked={attachments.includes(a)}
                    onCheckedChange={(checked) => setAttachments(checked ? [...attachments, a] : attachments.filter((x) => x !== a))}
                  />
                  <FieldLabel htmlFor={a} className="font-normal">
                    {a}
                  </FieldLabel>
                </Field>
              ))}
              {errors.attachments && <span className="text-sm text-destructive">{errors.attachments}</span>}
            </div>
          </FormSection>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2Icon className="animate-spin" />}
              Ajukan BPHTB
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SummaryCard
            title="Perhitungan"
            rows={[
              { label: 'Harga transaksi', value: formatRupiah(price ?? 0) },
              { label: 'NJOP', value: formatRupiah(nop?.njop ?? 0) },
              { label: 'NPOP (yang lebih tinggi)', value: formatRupiah(calc.npop) },
              { label: 'NPOPTKP', value: formatRupiah(calc.npoptkp) },
              { label: 'NPOPKP', value: formatRupiah(calc.npopkp) },
              { label: 'Tarif', value: `${calc.rate}%` },
            ]}
            total={{ label: 'BPHTB terutang', value: formatRupiah(calc.amount) }}
          />
          {nop && price && calc.belowNjop && (
            <div role="status" className="flex gap-2 rounded-md border border-chart-3/40 bg-chart-3/10 p-3 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-chart-3" />
              <span>Harga transaksi di bawah NJOP. Dasar pengenaan memakai NJOP.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
