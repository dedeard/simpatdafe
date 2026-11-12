function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const SIZE = 25

function finder(x: number, y: number) {
  const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
  const ring = (ox: number, oy: number) => {
    const dx = x - ox
    const dy = y - oy
    const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
    return edge || core
  }
  if (inBox(0, 0)) return ring(0, 0)
  if (inBox(SIZE - 7, 0)) return ring(SIZE - 7, 0)
  if (inBox(0, SIZE - 7)) return ring(0, SIZE - 7)
  return null
}

export function FakeQr({ value, size = 128 }: { value: string; size?: number }) {
  let state = hash(value)
  const cells: Array<React.ReactNode> = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const reserved = (x < 8 && y < 8) || (x >= SIZE - 8 && y < 8) || (x < 8 && y >= SIZE - 8)
      let on: boolean
      if (reserved) on = finder(x, y) ?? false
      else {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        on = (state >>> 24) % 2 === 0
      }
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }
  return (
    <svg
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      width={size}
      height={size}
      role="img"
      aria-label="Kode QR contoh"
      className="rounded bg-white p-1 text-black"
      fill="currentColor"
    >
      {cells}
    </svg>
  )
}
