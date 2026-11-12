import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import { AirTanahForm, ReklameForm, SkpdkbForm } from '../-components/AssessmentForms'
import { PageHeader } from '../../-components'

export const Route = createFileRoute('/_app/penetapan/create/')({
  head: () => ({ meta: [{ title: 'Buat ketetapan | SIMPATDA Raja Ampat' }] }),
  component: CreateAssessmentPage,
})

function CreateAssessmentPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Buat ketetapan"
        description="Terbitkan SKPD untuk pajak yang dihitung BP2RD, atau SKPDKB atas hasil pemeriksaan."
        back={{ to: '/penetapan', label: 'Daftar ketetapan' }}
      />
      <Tabs defaultValue="reklame">
        <TabsList>
          <TabsTrigger value="reklame">SKPD Reklame</TabsTrigger>
          <TabsTrigger value="airtanah">SKPD Air Tanah</TabsTrigger>
          <TabsTrigger value="skpdkb">SKPDKB</TabsTrigger>
        </TabsList>
        <TabsContent value="reklame" className="pt-4">
          <ReklameForm />
        </TabsContent>
        <TabsContent value="airtanah" className="pt-4">
          <AirTanahForm />
        </TabsContent>
        <TabsContent value="skpdkb" className="pt-4">
          <SkpdkbForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
