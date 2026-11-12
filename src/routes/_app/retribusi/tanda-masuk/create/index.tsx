import { FormAlert } from '@/components/form-alert'
import { OptionSelect } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  CATEGORY_LABEL,
  NATIONALITIES,
  POINT_LABEL,
  createTicket,
  type EntryCategory,
  type SellingPoint,
  type Visitor,
} from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { ticketPrice } from '@/lib/tax'
import { cn, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormSection, PageHeader, SelectField, SummaryCard } from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'
import { digitsOnly, toOptions } from '../../../-utils'

export const Route = createFileRoute('/_app/retribusi/tanda-masuk/create/')({
  head: () => ({ meta: [{ title: 'Jual tiket | SIMPATDA Raja Ampat' }] }),
  component: SellTicketPage,
})

const emptyVisitor = (): Visitor => ({ name: '', nationality: 'AU', category: 'mancanegara', idNumber: '' })

function SellTicketPage() {
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [point, setPoint] = useState<SellingPoint>('pelabuhan_waisai')
  const [channel, setChannel] = useState<'qris' | 'tunai' | 'va'>('qris')
  const [visitors, setVisitors] = useState<Array<Visitor>>([emptyVisitor()])
  const [errors, setErrors] = useState<Array<string | undefined>>([])
  const { pending, error, run } = useSubmit()

  const update = (i: number, patch: Partial<Visitor>) => setVisitors(visitors.map((v, k) => (k === i ? { ...v, ...patch } : v)))
  const setNationality = (i: number, code: string) => {
    const nat = NATIONALITIES.find((n) => n.code === code)
    update(i, { nationality: code, category: nat?.category ?? 'mancanegara' })
  }

  const counts = visitors.reduce<Record<EntryCategory, number>>((acc, v) => ({ ...acc, [v.category]: acc[v.category] + 1 }), {
    mancanegara: 0,
    domestik: 0,
    lokal: 0,
  })
  const total = visitors.reduce((s, v) => s + ticketPrice(v.category, tariffs), 0)

  const submit = () =>
    run(async () => {
      const found = visitors.map((v) => {
        if (!v.name.trim()) return 'Nama wajib diisi.'
        if (v.category === 'mancanegara') return v.idNumber.trim().length >= 6 ? undefined : 'No. paspor minimal 6 karakter.'
        return /^\d{16}$/.test(v.idNumber) ? undefined : 'NIK harus 16 digit.'
      })
      setErrors(found)
      if (found.some(Boolean)) return
      const result = await createTicket({ point, channel, visitors })
      toast.success('Tiket terbit dan pembayaran tercatat.')
      await navigate({ to: '/retribusi/tanda-masuk/$id', params: { id: toSlug(result.id) } })
    })

  return (
    <div
      className="flex flex-col gap-4 p-4 md:gap-6 md:p-6"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault()
          void submit()
        }
      }}
    >
      <PageHeader
        title="Jual tiket"
        description="Tekan Enter di kolom identitas untuk menambah baris pengunjung, Ctrl + Enter untuk menerbitkan."
        back={{ to: '/retribusi/tanda-masuk', label: 'Daftar tiket' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          <FormSection title="Loket dan pembayaran">
            <SelectField
              label="Loket"
              required
              value={point}
              onChange={(v) => setPoint(v as SellingPoint)}
              options={toOptions(POINT_LABEL)}
            />
            <SelectField
              label="Kanal bayar"
              required
              value={channel}
              onChange={(v) => setChannel(v as typeof channel)}
              options={[
                { value: 'qris', label: 'QRIS' },
                { value: 'tunai', label: 'Tunai' },
                { value: 'va', label: 'Virtual account' },
              ]}
            />
          </FormSection>
          <Card>
            <CardHeader>
              <CardTitle>Pengunjung</CardTitle>
              <CardDescription>1–20 orang per tiket. Kategori ditentukan dari kebangsaan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {visitors.map((v, i) => (
                <div
                  key={i}
                  className={cn(
                    'grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_11rem_12rem_auto] sm:items-start',
                    errors[i] && 'border-destructive',
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <Input
                      aria-label={`Nama pengunjung ${i + 1}`}
                      placeholder="Nama lengkap"
                      value={v.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      aria-invalid={Boolean(errors[i])}
                    />
                    {errors[i] && <span className="text-xs text-destructive">{errors[i]}</span>}
                  </div>
                  <OptionSelect
                    aria-label="Kebangsaan"
                    clearable={false}
                    value={v.nationality}
                    onChange={(value) => setNationality(i, value)}
                    options={NATIONALITIES.map((n) => ({ value: n.code, label: n.name }))}
                  />
                  <Input
                    aria-label="Nomor identitas"
                    placeholder={v.category === 'mancanegara' ? 'No. paspor' : 'NIK (16 digit)'}
                    value={v.idNumber}
                    onChange={(e) =>
                      update(i, { idNumber: v.category === 'mancanegara' ? e.target.value : digitsOnly(e.target.value).slice(0, 16) })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey && visitors.length < 20 && i === visitors.length - 1) {
                        e.preventDefault()
                        setVisitors([...visitors, { ...emptyVisitor(), nationality: v.nationality, category: v.category }])
                      }
                    }}
                  />
                  <div className="flex items-center gap-1">
                    {v.nationality === 'ID' && (
                      <OptionSelect
                        aria-label="Kategori"
                        className="w-32"
                        clearable={false}
                        value={v.category}
                        onChange={(value) => update(i, { category: value as EntryCategory })}
                        options={[
                          { value: 'domestik', label: CATEGORY_LABEL.domestik },
                          { value: 'lokal', label: CATEGORY_LABEL.lokal },
                        ]}
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus pengunjung"
                      disabled={visitors.length === 1}
                      onClick={() => setVisitors(visitors.filter((_, k) => k !== i))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={visitors.length >= 20}
                  onClick={() => setVisitors([...visitors, emptyVisitor()])}
                >
                  <PlusIcon />
                  Tambah pengunjung
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2Icon className="animate-spin" />}
              Terbitkan tiket
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Total pembayaran"
          rows={[
            { label: `Mancanegara × ${counts.mancanegara}`, value: formatRupiah(counts.mancanegara * ticketPrice('mancanegara', tariffs)) },
            { label: `Domestik × ${counts.domestik}`, value: formatRupiah(counts.domestik * ticketPrice('domestik', tariffs)) },
            { label: `Lokal Papua × ${counts.lokal}`, value: formatRupiah(counts.lokal * ticketPrice('lokal', tariffs)) },
          ]}
          total={{ label: 'Total', value: formatRupiah(total) }}
          footer="Tiket berlaku 1 tahun sejak diterbitkan. Pembayaran dicatat otomatis sebagai SSPD."
        />
      </div>
    </div>
  )
}
