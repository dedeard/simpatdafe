import { ADMIN_ROLE_ID } from '@/lib/api/resources'
import { useSyncExternalStore } from 'react'

const KEY = 'simpatda.role'
const listeners = new Set<() => void>()

function read(): string {
  try {
    return localStorage.getItem(KEY) || ADMIN_ROLE_ID
  } catch {
    return ADMIN_ROLE_ID
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Demo only: the signed-in user's role is picked in the user menu instead of coming from a session
export function useRole() {
  const roleId = useSyncExternalStore(subscribe, read, () => ADMIN_ROLE_ID)
  const setRole = (next: string) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // storage unavailable (private mode): the role switch is session-only
    }
    listeners.forEach((l) => l())
  }
  return { roleId, setRole }
}
