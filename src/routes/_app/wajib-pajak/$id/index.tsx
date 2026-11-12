import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { ENTITY_LABEL } from '@/lib/api/resources'
import { formatDate } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'
import { useTaxpayer } from '../-hooks'
import { DetailCard } from '../../-components'

export const Route = createFileRoute('/_app/wajib-pajak/$id/')({ component: ProfilePage })

function ProfilePage() {
  const { taxpayer } = useTaxpayer()
  return (
    <div className="flex flex-col gap-4">
      {taxpayer.rejectionReason && <FormAlert>Pendaftaran dikembalikan: {taxpayer.rejectionReason}</FormAlert>}
      <DetailCard
        title="Identitas"
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to="/wajib-pajak/$id/edit" params={{ id: taxpayer.id }} />}
          >
            <PencilIcon />
            Ubah
          </Button>
        }
        items={[
          { label: 'Jenis WP', value: ENTITY_LABEL[taxpayer.type] },
          { label: 'Nama', value: taxpayer.name },
          { label: 'Pemilik / penanggung jawab', value: taxpayer.ownerName },
          {
            label: taxpayer.type === 'pribadi' ? 'NIK' : 'NPWP',
            value: <span className="font-mono">{taxpayer.nik ?? taxpayer.npwp}</span>,
          },
          { label: 'Telepon', value: taxpayer.phone },
          { label: 'Email', value: taxpayer.email },
        ]}
      />
      <DetailCard
        title="Alamat dan registrasi"
        items={[
          { label: 'Distrik', value: taxpayer.distrik },
          { label: 'Kampung', value: taxpayer.kampung },
          { label: 'Alamat', value: taxpayer.address, wide: true },
          { label: 'Sektor', value: taxpayer.sector },
          { label: 'Tanggal terdaftar', value: formatDate(taxpayer.registeredAt) },
          { label: 'Disetujui', value: taxpayer.approvedAt ? `${formatDate(taxpayer.approvedAt)} oleh ${taxpayer.approvedBy}` : undefined },
        ]}
      />
    </div>
  )
}
