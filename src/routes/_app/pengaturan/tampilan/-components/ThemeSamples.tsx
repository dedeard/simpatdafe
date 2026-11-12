import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { ThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

function MiniWindow({ dark, accent }: { dark: boolean; accent: string }) {
  const panel = dark ? 'bg-neutral-900' : 'bg-white'
  const line = dark ? 'bg-neutral-700' : 'bg-neutral-200'
  return (
    <div className={cn('flex h-20 gap-1.5 p-1.5', dark ? 'bg-neutral-950' : 'bg-neutral-100')}>
      <div className={cn('flex w-1/4 flex-col gap-1 rounded-sm p-1', panel)}>
        <div className="h-1.5 rounded-full" style={{ background: accent }} />
        <div className={cn('h-1.5 rounded-full', line)} />
        <div className={cn('h-1.5 rounded-full', line)} />
      </div>
      <div className={cn('flex flex-1 flex-col gap-1 rounded-sm p-1.5', panel)}>
        <div className={cn('h-2 w-2/3 rounded-full', dark ? 'bg-neutral-600' : 'bg-neutral-300')} />
        <div className={cn('h-1.5 w-full rounded-full', line)} />
        <div className={cn('h-1.5 w-4/5 rounded-full', line)} />
        <div className="mt-auto h-3 w-1/3 rounded-sm" style={{ background: accent }} />
      </div>
    </div>
  )
}

export function ModeSample({ mode, light, dark }: { mode: ThemeMode; light: string; dark: string }) {
  if (mode === 'system') {
    return (
      <div className="relative overflow-hidden rounded-md">
        <MiniWindow dark={false} accent={light} />
        <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
          <MiniWindow dark accent={dark} />
        </div>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-md">
      <MiniWindow dark={mode === 'dark'} accent={mode === 'dark' ? dark : light} />
    </div>
  )
}

export function ColorSample({ color }: { color: string }) {
  return (
    <div className="flex h-10 items-center justify-center">
      <span className="size-6 rounded-full ring-1 ring-foreground/10" style={{ background: color }} />
    </div>
  )
}

export function RadiusSample({ radius }: { radius: number }) {
  return (
    <div className="flex h-10 items-end justify-center overflow-hidden pt-2">
      <div className="h-8 w-10 border-t-2 border-l-2 border-primary" style={{ borderTopLeftRadius: `${radius}rem` }} />
    </div>
  )
}

export function ThemePreview() {
  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>Pratinjau</CardTitle>
        <CardDescription>Perubahan langsung berlaku di seluruh aplikasi.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-semibold tracking-tight">Penerimaan hari ini</p>
          <p className="text-sm text-muted-foreground">
            Setoran pajak hotel dan restoran dari 14 wajib pajak sudah tercatat. Rekonsiliasi kanal bank dijadwalkan pukul 16.00 WIT.
          </p>
          <p className="font-mono text-xs text-muted-foreground">NPWPD P.2.0000123.04.17</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Simpan</Button>
          <Button size="sm" variant="outline">
            Batal
          </Button>
          <Badge>Lunas</Badge>
          <Badge variant="secondary">Draf</Badge>
        </div>
        <Input placeholder="Cari NPWPD atau nama…" aria-label="Contoh isian" />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked />
          Wajib lapor bulanan
        </label>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Realisasi PAD</span>
            <span className="tabular-nums">72%</span>
          </div>
          <Progress value={72} />
        </div>
      </CardContent>
    </Card>
  )
}
