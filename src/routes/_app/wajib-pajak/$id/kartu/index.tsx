import { ENTITY_LABEL } from '@/lib/api/resources'
import { formatDate } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { useTaxpayer } from '../../-hooks'
import { DocFields, DocumentPreview } from '../../../-components'

export const Route = createFileRoute('/_app/wajib-pajak/$id/kartu/')({ component: CardPage })

function CardPage() {
  const { taxpayer } = useTaxpayer()
  return (
    <DocumentPreview
      title="Kartu Nomor Pokok Wajib Pajak Daerah"
      number={taxpayer.npwpd ?? undefined}
      signatory="npwpd"
      printLabel="Cetak kartu"
    >
      <DocFields
        rows={[
          [
            'NPWPD',
            <span key="n" className="font-mono">
              {taxpayer.npwpd ?? 'Belum terbit'}
            </span>,
          ],
          ['Nama wajib pajak', taxpayer.name],
          ['Jenis', ENTITY_LABEL[taxpayer.type]],
          ['Nama pemilik', taxpayer.ownerName],
          ['Alamat', taxpayer.address],
          ['Distrik / kampung', `${taxpayer.distrik} / ${taxpayer.kampung}`],
          ['Tanggal terdaftar', formatDate(taxpayer.registeredAt, { dateStyle: 'long' })],
        ]}
      />
    </DocumentPreview>
  )
}
