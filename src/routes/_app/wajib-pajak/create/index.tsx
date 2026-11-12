import { createFileRoute } from '@tanstack/react-router'
import { CreateTaxpayerForm } from '../-components'
import { PageHeader } from '../../-components'

export const Route = createFileRoute('/_app/wajib-pajak/create/')({
  head: () => ({ meta: [{ title: 'Daftarkan WP | SIMPATDA Raja Ampat' }] }),
  component: CreateTaxpayerPage,
})

function CreateTaxpayerPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Daftarkan wajib pajak"
        description="Isi identitas, alamat, dan objek pajak pertama. Pendaftaran masuk ke antrean verifikasi."
        back={{ to: '/wajib-pajak', label: 'Daftar WP' }}
      />
      <CreateTaxpayerForm />
    </div>
  )
}
