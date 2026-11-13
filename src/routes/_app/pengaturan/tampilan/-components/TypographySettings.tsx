import { Separator } from '@/components/ui/separator'
import {
  FONT_STACKS,
  THEME_ALIGNS,
  THEME_DENSITIES,
  THEME_FONTS,
  THEME_HEADING_FONTS,
  THEME_LEADINGS,
  THEME_MONO_FONTS,
  THEME_SIZES,
  THEME_WIDTHS,
  type ThemeSettings,
} from '@/lib/theme'
import {
  ALargeSmallIcon,
  AlignCenterVerticalIcon,
  AlignStartVerticalIcon,
  AlignVerticalSpaceAroundIcon,
  MoveHorizontalIcon,
  UnfoldVerticalIcon,
} from 'lucide-react'
import { SettingTile } from './SettingTile'

type TypographySettingsProps = {
  settings: ThemeSettings
  onChange: (patch: Partial<ThemeSettings>) => void
}

const Aa = <span className="text-sm font-medium">Aa</span>

export function TypographySettings({ settings, onChange }: TypographySettingsProps) {
  const bodyStack = FONT_STACKS[settings.fontBody]
  const withFont = <T extends string>(choices: Array<{ value: T; label: string }>) =>
    choices.map((c) => ({ ...c, fontFamily: c.value === 'body' ? bodyStack : FONT_STACKS[c.value as keyof typeof FONT_STACKS] }))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SettingTile
          label="Lebar konten"
          value={settings.width}
          options={THEME_WIDTHS}
          onChange={(width) => onChange({ width })}
          icon={<MoveHorizontalIcon />}
        />
        <SettingTile
          label="Posisi konten"
          value={settings.align}
          options={THEME_ALIGNS}
          onChange={(align) => onChange({ align })}
          icon={settings.align === 'left' ? <AlignStartVerticalIcon /> : <AlignCenterVerticalIcon />}
        />
        <SettingTile
          label="Kerapatan"
          value={settings.density}
          options={THEME_DENSITIES}
          onChange={(density) => onChange({ density })}
          icon={<UnfoldVerticalIcon />}
        />
      </div>
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SettingTile
          label="Judul"
          value={settings.fontHeading}
          options={withFont(THEME_HEADING_FONTS)}
          onChange={(fontHeading) => onChange({ fontHeading })}
          icon={Aa}
        />
        <SettingTile
          label="Isi"
          value={settings.fontBody}
          options={withFont(THEME_FONTS)}
          onChange={(fontBody) => onChange({ fontBody })}
          icon={Aa}
        />
        <SettingTile
          label="Mono"
          value={settings.fontMono}
          options={withFont(THEME_MONO_FONTS)}
          onChange={(fontMono) => onChange({ fontMono })}
          icon={Aa}
        />
      </div>
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingTile
          label="Ukuran"
          value={settings.size}
          options={THEME_SIZES}
          onChange={(size) => onChange({ size })}
          icon={<ALargeSmallIcon />}
        />
        <SettingTile
          label="Jarak baris"
          value={settings.leading}
          options={THEME_LEADINGS}
          onChange={(leading) => onChange({ leading })}
          icon={<AlignVerticalSpaceAroundIcon />}
        />
      </div>
    </div>
  )
}
