import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { PrinterIcon } from 'lucide-react'
import { useAppData } from '../-hooks'

type DocumentPreviewProps = {
  title: string
  number?: string
  signatory: string
  children: React.ReactNode
  stamp?: string
  printLabel?: string
  hideSignature?: boolean
}

export function DocumentPreview({ title, number, signatory, children, stamp, printLabel = 'Cetak', hideSignature }: DocumentPreviewProps) {
  const { signatories } = useAppData()
  const sign = signatories.find((s) => s.kind === signatory)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <PrinterIcon />
          {printLabel}
        </Button>
      </div>
      <article className="print-area relative mx-auto w-full max-w-3xl rounded-xl bg-white p-8 text-sm text-neutral-900 ring-1 ring-foreground/10">
        <header className="flex flex-col items-center gap-0.5 border-b-2 border-neutral-900 pb-3 text-center">
          <span className="text-xs tracking-wide">PEMERINTAH KABUPATEN RAJA AMPAT</span>
          <span className="text-base font-bold">BADAN PENGELOLA PAJAK DAN RETRIBUSI DAERAH</span>
          <span className="text-xs text-neutral-600">Waisai, Kabupaten Raja Ampat, Provinsi Papua Barat Daya</span>
        </header>
        <div className="flex flex-col items-center gap-0.5 py-4 text-center">
          <h2 className="text-base font-bold tracking-wide uppercase">{title}</h2>
          {number && <span className="font-mono text-xs">Nomor: {number}</span>}
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        {!hideSignature && sign && (
          <div className="mt-10 flex justify-end">
            <div className="flex w-64 flex-col items-center gap-1 text-center">
              <span>Waisai, {formatDate('2026-11-12', { dateStyle: 'long' })}</span>
              <span>{sign.title}</span>
              <span className="mt-14 font-semibold underline">{sign.name}</span>
              <span className="text-xs">NIP. {sign.nip}</span>
            </div>
          </div>
        )}
        {stamp && (
          <div className="absolute right-8 bottom-28 -rotate-12 rounded border-2 border-chart-4 px-3 py-1 text-xs font-bold tracking-widest text-chart-4 uppercase opacity-80">
            {stamp}
          </div>
        )}
      </article>
    </div>
  )
}

export function DocTable({ head, rows }: { head: Array<string>; rows: Array<Array<React.ReactNode>> }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={h}
              className={`border border-neutral-400 bg-neutral-100 px-2 py-1 ${i === head.length - 1 ? 'text-right' : 'text-left'}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className={`border border-neutral-400 px-2 py-1 ${j === row.length - 1 ? 'text-right tabular-nums' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function DocFields({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <table className="text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="align-top">
            <td className="w-44 py-0.5 pr-2">{label}</td>
            <td className="py-0.5 pr-2">:</td>
            <td className="py-0.5 font-medium">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
