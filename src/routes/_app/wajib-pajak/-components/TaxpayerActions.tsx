import { Button } from '@/components/ui/button'
import { decideTaxpayer, type TaxpayerDecision, type TaxpayerRow } from '@/lib/api/resources'
import { Link, useRouter } from '@tanstack/react-router'
import { CircleCheckIcon, CircleXIcon, IdCardIcon, PauseIcon, PlayIcon, StoreIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../../-components'

type Pending = { action: TaxpayerDecision; title: string; description: string; label: string; reason?: string; destructive?: boolean }

const DIALOGS: Record<TaxpayerDecision, Pending> = {
  approve: {
    action: 'approve',
    title: 'Setujui pendaftaran?',
    description: 'NPWPD akan diterbitkan dan WP berstatus Aktif.',
    label: 'Setujui',
  },
  reject: {
    action: 'reject',
    title: 'Tolak pendaftaran?',
    description: 'Pendaftaran dikembalikan ke Draf beserta alasannya.',
    label: 'Tolak',
    reason: 'Alasan penolakan',
    destructive: true,
  },
  suspend: {
    action: 'suspend',
    title: 'Non-aktifkan sementara?',
    description: 'WP tidak akan muncul di daftar wajib lapor selama non-aktif.',
    label: 'Non-aktifkan',
  },
  reactivate: { action: 'reactivate', title: 'Aktifkan kembali?', description: 'WP kembali berstatus Aktif.', label: 'Aktifkan' },
  close: {
    action: 'close',
    title: 'Tutup usaha?',
    description: 'Semua objek pajak WP menjadi tidak aktif. Tindakan ini tidak dapat dibatalkan dari sini.',
    label: 'Tutup usaha',
    reason: 'Alasan penutupan',
    destructive: true,
  },
}

export function TaxpayerActions({ taxpayer }: { taxpayer: TaxpayerRow }) {
  const router = useRouter()
  const [dialog, setDialog] = useState<Pending | null>(null)

  const open = (action: TaxpayerDecision) => setDialog(DIALOGS[action])

  return (
    <>
      {taxpayer.status === 'verification' && (
        <>
          <Button onClick={() => open('approve')}>
            <CircleCheckIcon />
            Setujui
          </Button>
          <Button variant="outline" onClick={() => open('reject')}>
            <CircleXIcon />
            Tolak
          </Button>
        </>
      )}
      {taxpayer.status === 'active' && (
        <>
          <Button variant="outline" onClick={() => open('suspend')}>
            <PauseIcon />
            Non-aktifkan
          </Button>
          <Button variant="outline" onClick={() => open('close')}>
            <StoreIcon />
            Tutup usaha
          </Button>
        </>
      )}
      {taxpayer.status === 'suspended' && (
        <Button onClick={() => open('reactivate')}>
          <PlayIcon />
          Aktifkan kembali
        </Button>
      )}
      {taxpayer.npwpd && (
        <Button variant="outline" nativeButton={false} render={<Link to="/wajib-pajak/$id/kartu" params={{ id: taxpayer.id }} />}>
          <IdCardIcon />
          Kartu NPWPD
        </Button>
      )}
      {dialog && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.label}
          destructive={dialog.destructive}
          askReason={dialog.reason}
          onConfirm={async (reason) => {
            const result = await decideTaxpayer({ id: taxpayer.id, action: dialog.action, reason })
            toast.success(result.npwpd && dialog.action === 'approve' ? `NPWPD terbit: ${result.npwpd}` : 'Status wajib pajak diperbarui.')
            await router.invalidate()
          }}
        />
      )}
    </>
  )
}
