import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { searchTaxpayers, type TaxpayerPick } from '@/lib/api/resources'
import { SearchIcon, UserSearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type TaxpayerPickerProps = {
  value: TaxpayerPick | null
  onChange: (taxpayer: TaxpayerPick) => void
  error?: string
  label?: string
  onlyActive?: boolean
  required?: boolean
}

export function TaxpayerPicker({ value, onChange, error, label = 'Wajib pajak', onlyActive = true, required }: TaxpayerPickerProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Array<TaxpayerPick>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const id = setTimeout(async () => {
      setLoading(true)
      const found = await searchTaxpayers({ q, onlyActive })
      if (!cancelled) {
        setResults(found)
        setLoading(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [open, q, onlyActive])

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Button type="button" variant="outline" className="h-auto justify-start py-2 text-left" onClick={() => setOpen(true)}>
        <UserSearchIcon />
        {value ? (
          <span className="flex min-w-0 flex-col items-start">
            <span className="truncate font-medium">{value.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{value.npwpd}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Pilih wajib pajak (NPWPD atau nama)</span>
        )}
      </Button>
      {error && <FieldError>{error}</FieldError>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cari wajib pajak</DialogTitle>
            <DialogDescription>Ketik NPWPD, nama usaha, atau nama pemilik.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" className="pl-8" />
          </div>
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {results.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    onChange(t)
                    setOpen(false)
                  }}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.npwpd} · {t.ownerName} · {t.distrik}
                  </span>
                </button>
              </li>
            ))}
            {!loading && results.length === 0 && (
              <li className="px-2 py-6 text-center text-muted-foreground">Tidak ada wajib pajak ditemukan.</li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </Field>
  )
}
