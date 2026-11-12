import type { TableQuery } from '@/lib/api/resources'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useTableParams() {
  const search = useSearch({ strict: false }) as TableQuery
  const navigate = useNavigate()

  const setParams = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      void navigate({
        to: '.',
        search: ((prev: TableQuery) => {
          const next: TableQuery = { ...prev, ...patch }
          if (resetPage && !('page' in patch)) delete next.page
          for (const key of Object.keys(next)) if (next[key] === undefined || next[key] === '') delete next[key]
          return next
        }) as never,
      })
    },
    [navigate],
  )

  return { search, setParams }
}
