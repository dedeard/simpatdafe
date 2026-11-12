export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (cell: string | number) => {
    const text = String(cell)
    return /[",\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  const body = rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob([String.fromCharCode(0xfeff), body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
