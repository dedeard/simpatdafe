import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { DownloadIcon, PrinterIcon } from 'lucide-react'
import { useAppData } from '../../-hooks'

type ReportSheetProps = {
  title: string
  period: string
  onCsv?: () => void
  children: React.ReactNode
}

export function ReportSheet({ title, period, onCsv, children }: ReportSheetProps) {
  const { signatories, users } = useAppData()
  const sign = signatories.find((s) => s.kind === 'laporan')
  const printedBy = users[0]?.name ?? 'Admin Demo'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        {onCsv && (
          <Button variant="outline" onClick={onCsv}>
            <DownloadIcon />
            Unduh CSV
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <PrinterIcon />
          Cetak
        </Button>
      </div>
      <div className="print-area flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 print:bg-white print:p-0 print:text-black">
        <header className="hidden flex-col items-center gap-0.5 border-b-2 border-black pb-2 text-center print:flex">
          <span className="text-xs tracking-wide">PEMERINTAH KABUPATEN RAJA AMPAT</span>
          <span className="text-base font-bold">BADAN PENGELOLA PAJAK DAN RETRIBUSI DAERAH</span>
        </header>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold print:text-center print:text-base print:uppercase">{title}</h2>
          <p className="text-sm text-muted-foreground print:text-center print:text-black">{period}</p>
        </div>
        {children}
        <footer className="hidden items-end justify-between pt-6 text-xs print:flex">
          <span>
            Dicetak oleh {printedBy} pada {formatDate('2026-11-12', { dateStyle: 'long' })} 08.30 WIT
          </span>
          {sign && (
            <span className="flex w-56 flex-col items-center gap-0.5 text-center text-sm">
              <span>{sign.title}</span>
              <span className="mt-10 font-semibold underline">{sign.name}</span>
              <span className="text-xs">NIP. {sign.nip}</span>
            </span>
          )}
        </footer>
      </div>
    </div>
  )
}
