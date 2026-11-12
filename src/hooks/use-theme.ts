import { applyThemeSettings, DEFAULT_THEME, sanitizeTheme, THEME_STORAGE_KEY, type ThemeSettings } from '@/lib/theme'
import { useSyncExternalStore } from 'react'

const DARK_QUERY = '(prefers-color-scheme: dark)'
const listeners = new Set<() => void>()
let cache: { raw: string | null; value: ThemeSettings } | null = null

function readRaw() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

function read(): ThemeSettings {
  const raw = readRaw()
  if (cache && cache.raw === raw) return cache.value
  let parsed: unknown
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  cache = { raw, value: sanitizeTheme(parsed) }
  return cache.value
}

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage)
    window.matchMedia(DARK_QUERY).addEventListener('change', onSystemChange)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorage)
      window.matchMedia(DARK_QUERY).removeEventListener('change', onSystemChange)
    }
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== THEME_STORAGE_KEY) return
  applyThemeSettings(read())
  notify()
}

function onSystemChange() {
  if (read().mode === 'system') applyThemeSettings(read())
  notify()
}

function readSystemDark() {
  return window.matchMedia(DARK_QUERY).matches
}

export function setTheme(patch: Partial<ThemeSettings>) {
  const next = { ...read(), ...patch }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
  } catch {
    cache = { raw: readRaw(), value: next }
  }
  applyThemeSettings(next)
  notify()
}

export function resetTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    cache = { raw: readRaw(), value: DEFAULT_THEME }
  }
  applyThemeSettings(DEFAULT_THEME)
  notify()
}

export function useTheme() {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_THEME)
  const systemDark = useSyncExternalStore(subscribe, readSystemDark, () => false)
  const resolvedMode: 'light' | 'dark' = settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode
  return { settings, resolvedMode, setTheme, resetTheme }
}
