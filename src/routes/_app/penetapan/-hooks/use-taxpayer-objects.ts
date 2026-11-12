import { getTaxpayer, type TaxObjectRow, type TaxpayerPick } from '@/lib/api/resources'
import { useState } from 'react'

export function useTaxpayerObjects(taxCodes: Array<string>) {
  const [taxpayer, setTaxpayer] = useState<TaxpayerPick | null>(null)
  const [objects, setObjects] = useState<Array<TaxObjectRow>>([])
  const [objectId, setObjectId] = useState('')

  const pick = async (t: TaxpayerPick) => {
    setTaxpayer(t)
    setObjectId('')
    const detail = await getTaxpayer(t.id)
    setObjects(detail.objects.filter((o) => o.status === 'active' && taxCodes.includes(o.taxCode)))
  }

  return { taxpayer, objects, objectId, setObjectId, pick, object: objects.find((o) => o.id === objectId) }
}
