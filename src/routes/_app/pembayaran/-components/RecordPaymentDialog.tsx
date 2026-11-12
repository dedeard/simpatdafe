import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CHANNEL_LABEL, recordPayment, type Channel, type SspdRow } from '@/lib/api/resources'
import { formatRupiah } from '@/lib/utils'
import { useRouter } from '@tanstack/react-router'
import { Loader2Icon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DateField, MoneyField, SelectField, TextField } from '../../-components'
import { useSubmit } from '../../-hooks'
import { toOptions } from '../../-utils'

export function RecordPaymentDialog({ sspd }: { sspd: SspdRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<Channel | ''>('')
  const [paidAt, setPaidAt] = useState('2026-11-12T08:30')
  const [bankRef, setBankRef] = useState('')
  const [amount, setAmount] = useState<number | undefined>(sspd.amount)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const submit = () =>
    run(async () => {
      const e: Record<string, string> = {}
      if (!channel) e.channel = 'Pilih kanal pembayaran.'
      if (!paidAt) e.paidAt = 'Waktu pembayaran wajib diisi.'
      else if (paidAt > '2026-11-12T08:30') e.paidAt = 'Tidak boleh di masa depan.'
      if (!bankRef.trim()) e.bankRef = 'Nomor referensi bank wajib diisi.'
      if (amount !== sspd.amount) e.amount = `Jumlah harus sama dengan tagihan (${formatRupiah(sspd.amount)}).`
      setErrors(e)
      if (Object.keys(e).length > 0 || !channel || amount === undefined) return
      await recordPayment({ id: sspd.id, channel, paidAt, bankRef, amount })
      toast.success('Pembayaran dicatat.')
      setOpen(false)
      await router.invalidate()
    })

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <WalletIcon />
        Catat pembayaran
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat pembayaran</DialogTitle>
            <DialogDescription>
              {sspd.id} · {formatRupiah(sspd.amount)}
            </DialogDescription>
          </DialogHeader>
          {error && <FormAlert>{error}</FormAlert>}
          <SelectField
            label="Kanal"
            required
            value={channel}
            error={errors.channel}
            onChange={(v) => setChannel(v as Channel)}
            options={toOptions(CHANNEL_LABEL)}
          />
          <DateField
            label="Tanggal dan jam bayar"
            type="datetime-local"
            required
            value={paidAt}
            max="2026-11-12T08:30"
            error={errors.paidAt}
            onChange={setPaidAt}
          />
          <TextField
            label="No. referensi bank"
            required
            value={bankRef}
            error={errors.bankRef}
            onChange={setBankRef}
            placeholder="mis. BP2026111200123"
          />
          <MoneyField label="Jumlah dibayar" required value={amount} error={errors.amount} onChange={setAmount} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
