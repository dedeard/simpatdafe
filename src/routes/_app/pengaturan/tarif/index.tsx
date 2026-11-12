import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { addTariffVersion, type Tariff } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2Icon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DateField, NumberField, PageHeader, TextField } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/tarif/')({
  head: () => ({ meta: [{ title: 'Tarif | SIMPATDA Raja Ampat' }] }),
  component: TariffsPage,
})

function show(t: Tariff) {
  if (t.unit.startsWith('Rp')) return `${formatRupiah(t.value)}${t.unit.length > 2 ? ` ${t.unit.slice(2).trim()}` : ''}`
  if (t.unit === '%' || t.unit.startsWith('%')) return `${t.value}${t.unit.replace('%', '%')}`
  return `${formatNumber(t.value)} ${t.unit}`
}

function EditDialog({ tariff, onClose }: { tariff: Tariff; onClose: () => void }) {
  const router = useRouter()
  const [value, setValue] = useState<number | undefined>(tariff.value)
  const [validFrom, setValidFrom] = useState(TODAY)
  const [basis, setBasis] = useState(tariff.legalBasis)
  const { pending, error, run } = useSubmit()
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah tarif</DialogTitle>
          <DialogDescription>
            {tariff.name}. Perubahan membuat versi baru yang berlaku pada tanggal tertentu, dokumen lama tidak berubah.
          </DialogDescription>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <NumberField label={`Nilai baru (${tariff.unit})`} required step="any" min={0} value={value} onChange={setValue} />
        <DateField label="Berlaku mulai" required value={validFrom} onChange={setValidFrom} />
        <TextField label="Dasar hukum" value={basis} onChange={setBasis} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                await addTariffVersion({ key: tariff.key, value: value ?? 0, validFrom, legalBasis: basis })
                toast.success('Versi tarif baru disimpan.')
                onClose()
                await router.invalidate()
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Simpan versi baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TariffsPage() {
  const { tariffs } = useAppData()
  const [editing, setEditing] = useState<Tariff | null>(null)
  const keys = [...new Set(tariffs.map((t) => t.key))]
  const current = keys.map(
    (key) =>
      tariffs.filter((t) => t.key === key && t.validFrom <= TODAY).sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ??
      tariffs.find((t) => t.key === key)!,
  )
  const groups = [...new Set(current.map((t) => t.group))]

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Tarif"
        description="Tarif pajak, sanksi, dan retribusi. Setiap perhitungan memakai versi yang berlaku pada tanggal dokumen."
      />
      {groups.map((group) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{group}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Tarif</TableHead>
                  <TableHead className="text-right">Nilai berlaku</TableHead>
                  <TableHead className="hidden md:table-cell">Berlaku sejak</TableHead>
                  <TableHead className="hidden lg:table-cell">Dasar hukum</TableHead>
                  <TableHead className="pr-6 text-right">Versi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current
                  .filter((t) => t.group === group)
                  .map((t) => {
                    const versions = tariffs.filter((x) => x.key === t.key)
                    return (
                      <TableRow key={t.key}>
                        <TableCell className="pl-6 whitespace-normal">{t.name}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{show(t)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(t.validFrom)}</TableCell>
                        <TableCell className="hidden max-w-64 truncate text-xs text-muted-foreground lg:table-cell" title={t.legalBasis}>
                          {t.legalBasis}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                            <PencilIcon />
                            {versions.length > 1 ? `${versions.length} versi` : 'Ubah'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      {editing && <EditDialog tariff={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
