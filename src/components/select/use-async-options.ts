import { useCallback, useEffect, useRef, useState } from 'react'

export type LoadOptionsParams = { search: string; page: number; signal: AbortSignal }

export type LoadOptionsResult<T> = { items: Array<T>; hasMore: boolean }

export type LoadOptions<T> = (params: LoadOptionsParams) => Promise<LoadOptionsResult<T>>

type State<T> = { key: string | null; items: Array<T>; page: number; hasMore: boolean; error: boolean }

type UseAsyncOptionsInput<T> = {
  loadOptions: LoadOptions<T>
  search: string
  enabled: boolean
  debounceMs: number
  cacheKey?: string | number
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

export function useAsyncOptions<T>({ loadOptions, search, enabled, debounceMs, cacheKey }: UseAsyncOptionsInput<T>) {
  const term = useDebouncedValue(search.trim(), debounceMs)
  const key = `${cacheKey ?? ''}\u0000${term}`

  const [state, setState] = useState<State<T>>({ key: null, items: [], page: 0, hasMore: false, error: false })
  const [attempt, setAttempt] = useState(0)

  const loadRef = useRef(loadOptions)
  const moreRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadRef.current = loadOptions
  })

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    moreRef.current?.abort()
    moreRef.current = null

    loadRef.current({ search: term, page: 1, signal: controller.signal }).then(
      (result) => {
        if (controller.signal.aborted) return
        setState({ key, items: result.items, page: 1, hasMore: result.hasMore, error: false })
      },
      () => {
        if (controller.signal.aborted) return
        setState({ key, items: [], page: 1, hasMore: false, error: true })
      },
    )

    return () => controller.abort()
  }, [enabled, key, term, attempt])

  const loadMore = useCallback(() => {
    if (moreRef.current || !state.hasMore || state.key !== key) return
    const controller = new AbortController()
    moreRef.current = controller

    loadRef
      .current({ search: term, page: state.page + 1, signal: controller.signal })
      .then(
        (result) => {
          if (controller.signal.aborted) return
          setState((prev) =>
            prev.key === key ? { ...prev, items: [...prev.items, ...result.items], page: prev.page + 1, hasMore: result.hasMore } : prev,
          )
        },
        () => {
          if (controller.signal.aborted) return
          setState((prev) => (prev.key === key ? { ...prev, hasMore: false, error: true } : prev))
        },
      )
      .finally(() => {
        if (moreRef.current === controller) moreRef.current = null
      })
  }, [state.hasMore, state.key, state.page, key, term])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return {
    options: state.items,
    hasMore: state.hasMore && state.key === key,
    isLoading: enabled && (state.key !== key || search.trim() !== term),
    isError: state.error && state.key === key,
    loadMore,
    retry,
  }
}
