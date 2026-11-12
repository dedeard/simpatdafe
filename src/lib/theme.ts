export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeColor = 'neutral' | 'blue' | 'teal' | 'green' | 'orange' | 'rose' | 'violet'
export type ThemeFont = 'inter' | 'geist' | 'jakarta' | 'serif' | 'system'
export type ThemeHeadingFont = ThemeFont | 'body'
export type ThemeMonoFont = 'system-mono' | 'geist-mono' | 'jetbrains'
export type ThemeWidth = 'narrow' | 'medium' | 'wide' | 'full'
export type ThemeLeading = 'tight' | 'normal' | 'relaxed'
export type ThemeDensity = 'compact' | 'normal' | 'comfortable'

export type ThemeSettings = {
  mode: ThemeMode
  color: ThemeColor
  radius: number
  width: ThemeWidth
  density: ThemeDensity
  fontHeading: ThemeHeadingFont
  fontBody: ThemeFont
  fontMono: ThemeMonoFont
  size: number
  leading: ThemeLeading
}

export const THEME_STORAGE_KEY = 'simpatda.theme'

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'system',
  color: 'neutral',
  radius: 0.625,
  width: 'full',
  density: 'normal',
  fontHeading: 'body',
  fontBody: 'inter',
  fontMono: 'system-mono',
  size: 16,
  leading: 'normal',
}

type Choice<T> = { value: T; label: string; hint?: string }

export const THEME_MODES: Array<Choice<ThemeMode>> = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Ikuti sistem' },
]

// Swatches mirror the [data-color] blocks in styles.css
export const THEME_COLORS: Array<Choice<ThemeColor> & { light: string; dark: string }> = [
  { value: 'neutral', label: 'Netral', light: 'oklch(0.205 0 0)', dark: 'oklch(0.922 0 0)' },
  { value: 'blue', label: 'Biru', light: 'oklch(0.546 0.245 262.881)', dark: 'oklch(0.546 0.245 262.881)' },
  { value: 'teal', label: 'Laut', light: 'oklch(0.6 0.118 184.704)', dark: 'oklch(0.6 0.118 184.704)' },
  { value: 'green', label: 'Hijau', light: 'oklch(0.627 0.194 149.214)', dark: 'oklch(0.627 0.194 149.214)' },
  { value: 'orange', label: 'Jingga', light: 'oklch(0.646 0.222 41.116)', dark: 'oklch(0.646 0.222 41.116)' },
  { value: 'rose', label: 'Merah', light: 'oklch(0.586 0.253 17.585)', dark: 'oklch(0.586 0.253 17.585)' },
  { value: 'violet', label: 'Ungu', light: 'oklch(0.541 0.281 293.009)', dark: 'oklch(0.541 0.281 293.009)' },
]

export const THEME_RADII: Array<Choice<number>> = [
  { value: 0, label: 'Tanpa' },
  { value: 0.3, label: 'Kecil' },
  { value: 0.625, label: 'Sedang' },
  { value: 1, label: 'Besar' },
]

export const THEME_FONTS: Array<Choice<ThemeFont>> = [
  { value: 'inter', label: 'Inter' },
  { value: 'geist', label: 'Geist' },
  { value: 'jakarta', label: 'Plus Jakarta Sans' },
  { value: 'serif', label: 'Source Serif 4' },
  { value: 'system', label: 'Font sistem' },
]

export const THEME_HEADING_FONTS: Array<Choice<ThemeHeadingFont>> = [{ value: 'body', label: 'Sama dengan isi' }, ...THEME_FONTS]

export const THEME_MONO_FONTS: Array<Choice<ThemeMonoFont>> = [
  { value: 'system-mono', label: 'Mono sistem' },
  { value: 'geist-mono', label: 'Geist Mono' },
  { value: 'jetbrains', label: 'JetBrains Mono' },
]

export const THEME_WIDTHS: Array<Choice<ThemeWidth>> = [
  { value: 'narrow', label: 'Sempit', hint: '1024px' },
  { value: 'medium', label: 'Sedang', hint: '1280px' },
  { value: 'wide', label: 'Lebar', hint: '1536px' },
  { value: 'full', label: 'Penuh', hint: 'Selebar layar' },
]

export const THEME_DENSITIES: Array<Choice<ThemeDensity>> = [
  { value: 'compact', label: 'Rapat', hint: '0,9×' },
  { value: 'normal', label: 'Normal', hint: '1×' },
  { value: 'comfortable', label: 'Lega', hint: '1,1×' },
]

export const THEME_SIZES: Array<Choice<number>> = [14, 15, 16, 17, 18].map((px) => ({
  value: px,
  label: `${px}px`,
  hint: px === 16 ? 'Bawaan' : undefined,
}))

export const THEME_LEADINGS: Array<Choice<ThemeLeading>> = [
  { value: 'tight', label: 'Rapat', hint: '1,35' },
  { value: 'normal', label: 'Normal', hint: '1,5' },
  { value: 'relaxed', label: 'Longgar', hint: '1,75' },
]

const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

export const FONT_STACKS: Record<ThemeFont | ThemeMonoFont, string> = {
  inter: `'Inter Variable', ${SANS_FALLBACK}`,
  geist: `'Geist Variable', ${SANS_FALLBACK}`,
  jakarta: `'Plus Jakarta Sans Variable', ${SANS_FALLBACK}`,
  serif: "'Source Serif 4 Variable', ui-serif, Georgia, serif",
  system: SANS_FALLBACK,
  'system-mono': MONO_FALLBACK,
  'geist-mono': `'Geist Mono Variable', ${MONO_FALLBACK}`,
  jetbrains: `'JetBrains Mono Variable', ${MONO_FALLBACK}`,
}

export const THEME_TOKENS = {
  fonts: FONT_STACKS,
  widths: { narrow: '64rem', medium: '80rem', wide: '96rem', full: 'none' } as Record<ThemeWidth, string>,
  spacing: { compact: '0.225rem', normal: '', comfortable: '0.275rem' } as Record<ThemeDensity, string>,
  leading: {
    tight: { base: '1.35', xs: '1.25', sm: '1.3', lg: '1.35' },
    normal: null,
    relaxed: { base: '1.75', xs: '1.6', sm: '1.65', lg: '1.7' },
  } as Record<ThemeLeading, Record<'base' | 'xs' | 'sm' | 'lg', string> | null>,
}

export type ThemeTokens = typeof THEME_TOKENS

function pick<T>(choices: Array<Choice<T>>, value: unknown, fallback: T) {
  return choices.find((c) => c.value === value)?.value ?? fallback
}

export function sanitizeTheme(raw: unknown): ThemeSettings {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  return {
    mode: pick(THEME_MODES, input.mode, DEFAULT_THEME.mode),
    color: pick(THEME_COLORS, input.color, DEFAULT_THEME.color),
    radius: pick(THEME_RADII, input.radius, DEFAULT_THEME.radius),
    width: pick(THEME_WIDTHS, input.width, DEFAULT_THEME.width),
    density: pick(THEME_DENSITIES, input.density, DEFAULT_THEME.density),
    fontHeading: pick(THEME_HEADING_FONTS, input.fontHeading, DEFAULT_THEME.fontHeading),
    fontBody: pick(THEME_FONTS, input.fontBody, DEFAULT_THEME.fontBody),
    fontMono: pick(THEME_MONO_FONTS, input.fontMono, DEFAULT_THEME.fontMono),
    size: pick(THEME_SIZES, input.size, DEFAULT_THEME.size),
    leading: pick(THEME_LEADINGS, input.leading, DEFAULT_THEME.leading),
  }
}

// Must stay self-contained: it is serialized into the inline <head> script
export function applyTheme(settings: ThemeSettings, tokens: ThemeTokens) {
  const root = document.documentElement
  const style = root.style
  const set = (name: string, value: string | undefined) => (value ? style.setProperty(name, value) : style.removeProperty(name))

  const dark = settings.mode === 'dark' || (settings.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', dark)
  style.colorScheme = dark ? 'dark' : 'light'
  if (settings.color === 'neutral') root.removeAttribute('data-color')
  else root.setAttribute('data-color', settings.color)

  set('--radius', `${settings.radius}rem`)
  set('--spacing', tokens.spacing[settings.density])
  set('--content-width', tokens.widths[settings.width])
  set('--app-font-sans', tokens.fonts[settings.fontBody])
  set('--app-font-heading', settings.fontHeading === 'body' ? '' : tokens.fonts[settings.fontHeading])
  set('--app-font-mono', tokens.fonts[settings.fontMono])
  style.fontSize = settings.size === 16 ? '' : `${settings.size}px`

  const leading = tokens.leading[settings.leading]
  style.lineHeight = leading ? leading.base : ''
  set('--text-base--line-height', leading?.base)
  set('--text-xs--line-height', leading?.xs)
  set('--text-sm--line-height', leading?.sm)
  set('--text-lg--line-height', leading?.lg)
}

export function applyThemeSettings(settings: ThemeSettings) {
  applyTheme(settings, THEME_TOKENS)
}

export const THEME_SCRIPT = `(function(){var s=${JSON.stringify(DEFAULT_THEME)};try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||'{}');if(v&&typeof v==='object')Object.assign(s,v)}catch(e){}try{(${applyTheme.toString()})(s,${JSON.stringify(THEME_TOKENS)})}catch(e){}})()`
