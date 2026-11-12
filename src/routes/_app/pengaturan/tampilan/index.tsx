import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/hooks'
import { DEFAULT_THEME, THEME_COLORS, THEME_MODES, THEME_RADII } from '@/lib/theme'
import { createFileRoute } from '@tanstack/react-router'
import { RotateCcwIcon } from 'lucide-react'
import { PageHeader } from '../../-components'
import { ColorSample, ModeSample, OptionGroup, RadiusSample, ThemePreview, TypographySettings } from './-components'

export const Route = createFileRoute('/_app/pengaturan/tampilan/')({
  head: () => ({ meta: [{ title: 'Tampilan | SIMPATDA Raja Ampat' }] }),
  component: AppearancePage,
})

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function AppearancePage() {
  const { settings, resolvedMode, setTheme, resetTheme } = useTheme()
  const accent = THEME_COLORS.find((c) => c.value === settings.color) ?? THEME_COLORS[0]
  const isDefault = JSON.stringify(settings) === JSON.stringify(DEFAULT_THEME)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Tampilan"
        description="Atur tema aplikasi. Pengaturan disimpan di peramban ini dan tidak memengaruhi pengguna lain."
        actions={
          <Button variant="outline" size="sm" disabled={isDefault} onClick={resetTheme}>
            <RotateCcwIcon />
            Kembalikan bawaan
          </Button>
        }
      />
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4 md:gap-6">
          <Section title="Mode" description="Pilih terang atau gelap, atau ikuti pengaturan perangkat.">
            <OptionGroup
              legend="Mode"
              className="grid-cols-2 sm:grid-cols-3"
              value={settings.mode}
              onChange={(mode) => setTheme({ mode })}
              options={THEME_MODES.map((m) => ({
                ...m,
                content: <ModeSample mode={m.value} light={accent.light} dark={accent.dark} />,
              }))}
            />
          </Section>
          <Section title="Warna aksen" description="Dipakai untuk tombol utama, tautan aktif dan sorotan.">
            <OptionGroup
              legend="Warna aksen"
              className="grid-cols-4 sm:grid-cols-7"
              value={settings.color}
              onChange={(color) => setTheme({ color })}
              options={THEME_COLORS.map((c) => ({
                value: c.value,
                label: c.label,
                content: <ColorSample color={resolvedMode === 'dark' ? c.dark : c.light} />,
              }))}
            />
          </Section>
          <Section title="Sudut" description="Kelengkungan sudut kartu, tombol dan isian.">
            <OptionGroup
              legend="Sudut"
              className="grid-cols-4"
              value={settings.radius}
              onChange={(radius) => setTheme({ radius })}
              options={THEME_RADII.map((r) => ({ ...r, content: <RadiusSample radius={r.value} /> }))}
            />
          </Section>
          <Section title="Tipografi dan tata letak" description="Lebar halaman, kerapatan, jenis huruf, ukuran dan jarak baris.">
            <TypographySettings settings={settings} onChange={setTheme} />
          </Section>
        </div>
        <ThemePreview />
      </div>
    </div>
  )
}
