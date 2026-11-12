import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DEMO_NOW, TODAY } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, XIcon } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { id as idLocale } from 'react-day-picker/locale'

export type DateTimePickerMode = 'date' | 'month' | 'datetime'

export type DateTimePickerProps = {
  mode?: DateTimePickerMode
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  minuteStep?: number
  defaultTime?: string
  id?: string
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}

const LOCALE = 'id-ID'
const dayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const MONTHS = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(new Date(2026, i, 1)))
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const PLACEHOLDER: Record<DateTimePickerMode, string> = {
  date: 'Pilih tanggal',
  month: 'Pilih bulan',
  datetime: 'Pilih tanggal dan jam',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function fromDayKey(key: string | undefined) {
  if (!key || !/^\d{4}-\d{2}-\d{2}/.test(key)) return undefined
  const [y, m, d] = key.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function clamp(value: string, min?: string, max?: string) {
  if (min && value < min) return min
  if (max && value > max) return max
  return value
}

function outside(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max))
}

function formatValue(mode: DateTimePickerMode, value: string) {
  if (!value) return null
  if (mode === 'month') {
    const [y, m] = value.split('-').map(Number)
    return y && m ? monthFormat.format(new Date(y, m - 1, 1)) : value
  }
  const day = fromDayKey(value)
  if (!day) return value
  const label = dayFormat.format(day)
  return mode === 'datetime' ? `${label}, ${value.slice(11, 16) || '--:--'}` : label
}

export function DateTimePicker({
  mode = 'date',
  value,
  onChange,
  min,
  max,
  placeholder = PLACEHOLDER[mode],
  clearable = true,
  disabled,
  minuteStep = 5,
  defaultTime = '08:00',
  id,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': invalid,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const label = formatValue(mode, value)
  const showClear = clearable && Boolean(value) && !disabled

  const commit = (next: string, close: boolean) => {
    onChange(next)
    if (close) setOpen(false)
  }

  const now = mode === 'month' ? TODAY.slice(0, 7) : mode === 'datetime' ? DEMO_NOW.slice(0, 16) : TODAY
  const nowLabel = mode === 'month' ? 'Bulan ini' : mode === 'datetime' ? 'Sekarang' : 'Hari ini'

  return (
    <div data-slot="date-time-picker" className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              id={id}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-invalid={invalid}
              className={cn(
                'w-full justify-start px-2.5 font-normal dark:bg-input/30',
                !label && 'text-muted-foreground',
                showClear && 'pr-8',
              )}
            />
          }
        >
          {mode === 'datetime' ? <ClockIcon className="text-muted-foreground" /> : <CalendarIcon className="text-muted-foreground" />}
          <span className="truncate tabular-nums">{label ?? placeholder}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto gap-0 overflow-hidden p-0">
          {mode === 'month' ? (
            <MonthPicker value={value} min={min} max={max} onSelect={(next) => commit(next, true)} />
          ) : mode === 'datetime' ? (
            <DateTimePanel
              value={value}
              min={min}
              max={max}
              minuteStep={minuteStep}
              defaultTime={defaultTime}
              onChange={(next) => commit(next, false)}
            />
          ) : (
            <DayCalendar
              value={value}
              min={min}
              max={max}
              onSelect={(day) => {
                if (day) commit(day, true)
              }}
            />
          )}
          <div className="flex items-center gap-1 border-t p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={outside(now, min, max)}
              onClick={() => commit(now, mode !== 'datetime')}
            >
              {nowLabel}
            </Button>
            {clearable && value && (
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => commit('', true)}>
                Hapus
              </Button>
            )}
            {mode === 'datetime' && (
              <Button type="button" size="sm" className="ml-auto" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {showClear && (
        <button
          type="button"
          aria-label="Hapus"
          className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          onClick={() => onChange('')}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}

type DayCalendarProps = { value: string; min?: string; max?: string; onSelect: (day: string | undefined) => void }

function DayCalendar({ value, min, max, onSelect }: DayCalendarProps) {
  const selected = fromDayKey(value)
  const minDay = min?.slice(0, 10)
  const maxDay = max?.slice(0, 10)
  const minMonth = minDay?.slice(0, 7)
  const maxMonth = maxDay?.slice(0, 7)

  const [month, setMonth] = useState(() => {
    const start = selected ?? fromDayKey(clamp(TODAY, minDay, maxDay)) ?? new Date()
    return new Date(start.getFullYear(), start.getMonth(), 1)
  })
  const [picking, setPicking] = useState(false)

  const shift = (n: number) => new Date(month.getFullYear(), month.getMonth() + n, 1)

  return (
    <div className="relative w-64 p-2.5">
      <div className={cn('flex flex-col gap-2', picking && 'invisible')}>
        <NavHeader
          label={monthFormat.format(month)}
          onLabelClick={() => setPicking(true)}
          onPrev={() => setMonth(shift(-1))}
          onNext={() => setMonth(shift(1))}
          prevDisabled={Boolean(minMonth && toMonthKey(shift(-1)) < minMonth)}
          nextDisabled={Boolean(maxMonth && toMonthKey(shift(1)) > maxMonth)}
        />
        <Calendar
          mode="single"
          locale={idLocale}
          weekStartsOn={1}
          today={fromDayKey(TODAY)}
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          hideNavigation
          fixedWeeks
          disabled={(date) => outside(toDayKey(date), minDay, maxDay)}
          onSelect={(date) => onSelect(date ? toDayKey(date) : undefined)}
          autoFocus
          className="p-0 [--cell-size:--spacing(8)]"
          classNames={{ root: 'w-full', month_caption: 'hidden' }}
        />
      </div>
      {picking && (
        <PeriodGrid
          className="absolute inset-0 p-2.5"
          year={month.getFullYear()}
          onYearChange={(year) => setMonth(new Date(year, month.getMonth(), 1))}
          selected={toMonthKey(month)}
          minMonth={minMonth}
          maxMonth={maxMonth}
          onPick={(key) => {
            setMonth(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1))
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

type DateTimePanelProps = {
  value: string
  min?: string
  max?: string
  minuteStep: number
  defaultTime: string
  onChange: (value: string) => void
}

function DateTimePanel({ value, min, max, minuteStep, defaultTime, onChange }: DateTimePanelProps) {
  const day = value.slice(0, 10)
  const time = value.slice(11, 16) || defaultTime
  const hour = Number(time.slice(0, 2))
  const minute = Number(time.slice(3, 5))

  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
  if (!minutes.includes(minute)) minutes.push(minute)
  minutes.sort((a, b) => a - b)

  const set = (nextDay: string, h: number, m: number) => onChange(clamp(`${nextDay}T${pad(h)}:${pad(m)}`, min, max))
  const baseDay = day || clamp(TODAY, min?.slice(0, 10), max?.slice(0, 10))

  const hourDisabled = (h: number) =>
    outside(`${baseDay}T${pad(h)}:59`, min, undefined) || outside(`${baseDay}T${pad(h)}:00`, undefined, max)
  const minuteDisabled = (m: number) => outside(`${baseDay}T${pad(hour)}:${pad(m)}`, min, max)

  return (
    <div className="flex">
      <DayCalendar value={day} min={min} max={max} onSelect={(next) => next && set(next, hour, minute)} />
      <div className="flex border-l">
        <TimeColumn
          label="Jam"
          values={HOURS}
          selected={day ? hour : undefined}
          isDisabled={hourDisabled}
          onSelect={(h) => set(baseDay, h, minute)}
        />
        <TimeColumn
          label="Menit"
          values={minutes}
          selected={day ? minute : undefined}
          isDisabled={minuteDisabled}
          onSelect={(m) => set(baseDay, hour, m)}
        />
      </div>
    </div>
  )
}

type TimeColumnProps = {
  label: string
  values: Array<number>
  selected: number | undefined
  isDisabled: (value: number) => boolean
  onSelect: (value: number) => void
}

function TimeColumn({ label, values, selected, isDisabled, onSelect }: TimeColumnProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const container = ref.current
    const active = container?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (container && active) container.scrollTop = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2
  }, [selected])

  return (
    <div className="flex w-14 flex-col not-last:border-r">
      <div className="border-b py-1.5 text-center text-xs font-medium text-muted-foreground">{label}</div>
      <div ref={ref} role="group" aria-label={label} className="relative no-scrollbar h-0 min-h-full flex-1 overflow-y-auto p-1">
        {values.map((v) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={v === selected ? 'default' : 'ghost'}
            aria-pressed={v === selected}
            disabled={isDisabled(v)}
            className="w-full tabular-nums"
            onClick={() => onSelect(v)}
          >
            {pad(v)}
          </Button>
        ))}
      </div>
    </div>
  )
}

type MonthPickerProps = { value: string; min?: string; max?: string; onSelect: (month: string) => void }

function MonthPicker({ value, min, max, onSelect }: MonthPickerProps) {
  const minMonth = min?.slice(0, 7)
  const maxMonth = max?.slice(0, 7)
  const [year, setYear] = useState(() => Number((value || clamp(TODAY.slice(0, 7), minMonth, maxMonth)).slice(0, 4)))

  return (
    <PeriodGrid
      className="h-60 w-64 p-2.5"
      year={year}
      onYearChange={setYear}
      selected={value || undefined}
      minMonth={minMonth}
      maxMonth={maxMonth}
      onPick={onSelect}
    />
  )
}

type NavHeaderProps = {
  label: string
  onLabelClick?: () => void
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
}

function NavHeader({ label, onLabelClick, onPrev, onNext, prevDisabled, nextDisabled }: NavHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Sebelumnya" disabled={prevDisabled} onClick={onPrev}>
        <ChevronLeftIcon />
      </Button>
      {onLabelClick ? (
        <Button type="button" variant="ghost" size="sm" className="gap-1 font-medium tabular-nums" onClick={onLabelClick}>
          {label}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      ) : (
        <span className="text-sm font-medium tabular-nums">{label}</span>
      )}
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Berikutnya" disabled={nextDisabled} onClick={onNext}>
        <ChevronRightIcon />
      </Button>
    </div>
  )
}

type PeriodGridProps = {
  year: number
  onYearChange: (year: number) => void
  selected?: string
  minMonth?: string
  maxMonth?: string
  onPick: (month: string) => void
  className?: string
}

function PeriodGrid({ year, onYearChange, selected, minMonth, maxMonth, onPick, className }: PeriodGridProps) {
  const [view, setView] = useState<'months' | 'years'>('months')
  const minYear = minMonth ? Number(minMonth.slice(0, 4)) : undefined
  const maxYear = maxMonth ? Number(maxMonth.slice(0, 4)) : undefined
  const pageStart = Math.floor(year / 12) * 12
  const currentMonth = TODAY.slice(0, 7)
  const currentYear = Number(TODAY.slice(0, 4))

  const cell = (key: string, label: string, isSelected: boolean, isCurrent: boolean, isDisabled: boolean, onClick: () => void) => (
    <Button
      key={key}
      type="button"
      size="sm"
      variant={isSelected ? 'default' : 'ghost'}
      aria-pressed={isSelected}
      disabled={isDisabled}
      className={cn('h-full tabular-nums', !isSelected && isCurrent && 'bg-muted')}
      onClick={onClick}
    >
      {label}
    </Button>
  )

  return (
    <div className={cn('flex flex-col gap-2 bg-popover', className)}>
      {view === 'months' ? (
        <NavHeader
          label={String(year)}
          onLabelClick={() => setView('years')}
          onPrev={() => onYearChange(year - 1)}
          onNext={() => onYearChange(year + 1)}
          prevDisabled={minYear !== undefined && year - 1 < minYear}
          nextDisabled={maxYear !== undefined && year + 1 > maxYear}
        />
      ) : (
        <NavHeader
          label={`${pageStart} – ${pageStart + 11}`}
          onPrev={() => onYearChange(year - 12)}
          onNext={() => onYearChange(year + 12)}
          prevDisabled={minYear !== undefined && pageStart - 1 < minYear}
          nextDisabled={maxYear !== undefined && pageStart + 12 > maxYear}
        />
      )}
      <div className="grid flex-1 auto-rows-fr grid-cols-3 gap-1">
        {view === 'months'
          ? MONTHS.map((name, i) => {
              const key = `${year}-${pad(i + 1)}`
              return cell(key, name, key === selected, key === currentMonth, outside(key, minMonth, maxMonth), () => onPick(key))
            })
          : Array.from({ length: 12 }, (_, i) => {
              const y = pageStart + i
              return cell(
                String(y),
                String(y),
                String(y) === selected?.slice(0, 4),
                y === currentYear,
                (minYear !== undefined && y < minYear) || (maxYear !== undefined && y > maxYear),
                () => {
                  onYearChange(y)
                  setView('months')
                },
              )
            })}
      </div>
    </div>
  )
}
