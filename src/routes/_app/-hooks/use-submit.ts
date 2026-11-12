import { useCallback, useState } from 'react'

export function useSubmit() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const run = useCallback(async (action: () => Promise<void>) => {
    setPending(true)
    setError(undefined)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setPending(false)
    }
  }, [])

  return { pending, error, run, setError }
}
