export function createRng(seed: number) {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min
  const between = (min: number, max: number) => next() * (max - min) + min
  const chance = (p: number) => next() < p
  const pick = <T>(items: ReadonlyArray<T>): T => items[Math.floor(next() * items.length)]

  const weighted = <T>(items: ReadonlyArray<readonly [T, number]>): T => {
    const total = items.reduce((s, [, w]) => s + w, 0)
    let roll = next() * total
    for (const [item, weight] of items) {
      roll -= weight
      if (roll <= 0) return item
    }
    return items[items.length - 1][0]
  }

  const shuffle = <T>(items: ReadonlyArray<T>): Array<T> => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const lognormal = (median: number, spread: number) => {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    return median * Math.exp(normal * spread)
  }

  return { next, int, between, chance, pick, weighted, shuffle, lognormal }
}

export type Rng = ReturnType<typeof createRng>
