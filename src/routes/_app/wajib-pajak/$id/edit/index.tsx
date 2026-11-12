import { createFileRoute } from '@tanstack/react-router'
import { EditTaxpayerForm } from '../../-components/EditTaxpayerForm'
import { useTaxpayer } from '../../-hooks'

export const Route = createFileRoute('/_app/wajib-pajak/$id/edit/')({ component: EditPage })

function EditPage() {
  const { taxpayer } = useTaxpayer()
  return <EditTaxpayerForm taxpayer={taxpayer} />
}
