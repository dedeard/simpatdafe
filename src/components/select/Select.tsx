import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual'
import { LoaderCircleIcon, PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useAsyncOptions, type LoadOptions } from './use-async-options'

type ListVirtualizer = Virtualizer<HTMLDivElement, Element>

export type SelectOption = { value: string; label: string }

type BaseProps<T> = {
  options?: Array<T>
  loadOptions?: LoadOptions<T>
  isOptionDisabled?: (option: T) => boolean
  getOptionValue?: (option: T) => string
  getOptionLabel?: (option: T) => string
  renderOption?: (option: T) => React.ReactNode
  renderChip?: (option: T) => React.ReactNode
  createOption?: (input: string) => T
  cacheKey?: string | number
  debounceMs?: number
  rowHeight?: number
  placeholder?: string
  emptyText?: string
  errorText?: string
  clearable?: boolean
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  popupClassName?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}

type SingleProps<T> = BaseProps<T> & { multiple?: false; value: T | null; onChange: (value: T | null) => void }

type MultipleProps<T> = BaseProps<T> & { multiple: true; value: Array<T>; onChange: (value: Array<T>) => void }

export type SelectProps<T> = SingleProps<T> | MultipleProps<T>

function defaultOptionValue(option: unknown) {
  if (typeof option === 'object' && option !== null && 'value' in option) return String(option.value)
  return String(option)
}

function defaultOptionLabel(option: unknown) {
  if (typeof option === 'object' && option !== null && 'label' in option) return String(option.label)
  return String(option)
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

const loadNothing = async () => ({ items: [], hasMore: false })

export function Select<T>(props: SelectProps<T>) {
  const {
    options: staticOptions,
    loadOptions = loadNothing,
    isOptionDisabled,
    getOptionValue = defaultOptionValue,
    getOptionLabel = defaultOptionLabel,
    renderOption,
    renderChip,
    createOption,
    cacheKey,
    debounceMs = 250,
    rowHeight = 32,
    placeholder = 'Pilih…',
    emptyText = 'Tidak ada data ditemukan.',
    errorText = 'Gagal memuat data.',
    clearable = true,
    disabled,
    id,
    name,
    className,
    popupClassName,
    'aria-label': ariaLabel,
    'aria-invalid': invalid,
  } = props

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const anchor = useComboboxAnchor()
  const virtualizerRef = useRef<ListVirtualizer | null>(null)

  const remote = useAsyncOptions({
    loadOptions,
    search,
    enabled: open && staticOptions === undefined,
    debounceMs,
    cacheKey,
  })

  const term = search.trim()

  const local = useMemo(() => {
    if (staticOptions === undefined) return null
    const words = normalize(term).split(/\s+/).filter(Boolean)
    if (words.length === 0) return staticOptions
    return staticOptions.filter((option) => {
      const label = normalize(getOptionLabel(option))
      return words.every((word) => label.includes(word))
    })
  }, [staticOptions, term, getOptionLabel])

  const options = local ?? remote.options
  const hasMore = local === null && remote.hasMore
  const isLoading = local === null && remote.isLoading
  const isError = local === null && remote.isError
  const { loadMore, retry } = remote
  const selected = props.multiple ? props.value : props.value ? [props.value] : []
  const selectedKey = selected.map(getOptionValue).join('\u0000')

  const candidate = useMemo(() => {
    if (!createOption || term === '' || isLoading) return null
    const created = createOption(term)
    const value = getOptionValue(created)
    const label = getOptionLabel(created).toLocaleLowerCase()
    const taken =
      selectedKey.split('\u0000').includes(value) ||
      options.some((option) => getOptionValue(option) === value || getOptionLabel(option).toLocaleLowerCase() === label)
    return taken ? null : created
  }, [createOption, getOptionLabel, getOptionValue, isLoading, options, selectedKey, term])

  const items = useMemo(() => (candidate ? [...options, candidate] : options), [options, candidate])

  const shared = {
    items,
    filter: null,
    virtualized: true,
    autoHighlight: true,
    disabled,
    name,
    itemToStringLabel: getOptionLabel,
    itemToStringValue: getOptionValue,
    isItemEqualToValue: (a: T, b: T) => getOptionValue(a) === getOptionValue(b),
    onInputValueChange: (next: string, details: { reason: string }) => setSearch(details.reason === 'input-change' ? next : ''),
    onItemHighlighted: (item: T | undefined, details: { reason: string; index: number }) => {
      const virtualizer = virtualizerRef.current
      if (item === undefined || !virtualizer || details.index >= options.length) return
      const isStart = details.index === 0
      const isEnd = details.index === options.length - 1
      if (details.reason === 'none' || (details.reason === 'keyboard' && (isStart || isEnd))) {
        queueMicrotask(() => virtualizer.scrollToIndex(details.index, { align: isEnd ? 'start' : 'end' }))
      }
    },
  }

  const popup = (
    <ComboboxContent anchor={props.multiple ? anchor : undefined} aria-busy={isLoading || undefined} className={popupClassName}>
      {isError ? (
        <div role="status" className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-destructive">
          {errorText}
          <button type="button" className="font-medium underline underline-offset-2" onClick={retry}>
            Coba lagi
          </button>
        </div>
      ) : isLoading && options.length === 0 ? (
        <div role="status" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Memuat…
        </div>
      ) : options.length === 0 && !candidate ? (
        <div role="status" className="px-3 py-2 text-center text-sm text-muted-foreground">
          {term === '' ? emptyText : `Tidak ada hasil untuk “${term}”.`}
        </div>
      ) : null}
      <ComboboxList className={cn('max-h-none overflow-visible p-0 transition-opacity', isLoading && 'opacity-60')}>
        <VirtualList
          options={options}
          hasMore={hasMore}
          rowHeight={rowHeight}
          onLoadMore={loadMore}
          getOptionValue={getOptionValue}
          isOptionDisabled={isOptionDisabled}
          renderOption={renderOption ?? getOptionLabel}
          virtualizerRef={virtualizerRef}
        />
        {candidate && (
          <div className={cn('p-1', options.length > 0 && 'border-t')}>
            <ComboboxItem index={options.length} value={candidate}>
              <PlusIcon />
              <span className="truncate">Tambah “{term}”</span>
            </ComboboxItem>
          </div>
        )}
      </ComboboxList>
    </ComboboxContent>
  )

  if (props.multiple) {
    const { value, onChange } = props
    return (
      <Combobox<T, true>
        {...shared}
        multiple
        open={open}
        value={value}
        onValueChange={onChange}
        onOpenChange={(next, details) => {
          if (!next && details.reason === 'item-press') {
            details.cancel()
            return
          }
          setOpen(next)
        }}
      >
        <ComboboxChips ref={anchor} className={cn('w-full', className)}>
          {value.map((option) => (
            <ComboboxChip key={getOptionValue(option)}>{renderChip ? renderChip(option) : getOptionLabel(option)}</ComboboxChip>
          ))}
          <ComboboxChipsInput id={id} placeholder={value.length > 0 ? '' : placeholder} aria-label={ariaLabel} aria-invalid={invalid} />
        </ComboboxChips>
        {popup}
      </Combobox>
    )
  }

  const { value, onChange } = props
  return (
    <Combobox<T>
      {...shared}
      open={open}
      value={value}
      onValueChange={(next) => {
        if (next !== null || clearable) onChange(next)
      }}
      onOpenChange={setOpen}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        disabled={disabled}
        showClear={clearable && value !== null}
        className={cn('w-full', className)}
      />
      {popup}
    </Combobox>
  )
}

type VirtualListProps<T> = {
  options: Array<T>
  hasMore: boolean
  rowHeight: number
  onLoadMore: () => void
  getOptionValue: (option: T) => string
  isOptionDisabled?: (option: T) => boolean
  renderOption: (option: T) => React.ReactNode
  virtualizerRef: React.RefObject<ListVirtualizer | null>
}

function VirtualList<T>({
  options,
  hasMore,
  rowHeight,
  onLoadMore,
  getOptionValue,
  isOptionDisabled,
  renderOption,
  virtualizerRef,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    count: options.length + (hasMore ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey: (index) => (index < options.length ? getOptionValue(options[index]) : '__loader__'),
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingStart: 4,
    scrollPaddingEnd: 4,
  })

  useImperativeHandle(virtualizerRef, () => virtualizer)

  const handleScrollRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element
      if (element) virtualizer.measure()
    },
    [virtualizer],
  )

  const rows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const lastIndex = rows.length > 0 ? rows[rows.length - 1].index : -1

  useEffect(() => {
    if (hasMore && lastIndex >= options.length - 1) onLoadMore()
  }, [hasMore, lastIndex, options.length, onLoadMore])

  if (options.length === 0) return null

  return (
    <div
      ref={handleScrollRef}
      role="presentation"
      className="no-scrollbar h-[min(18rem,var(--total-size))] max-h-(--available-height) overflow-y-auto overscroll-contain"
      style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
    >
      <div role="presentation" className="relative mx-1" style={{ height: totalSize }}>
        {rows.map((row) => {
          const style = { transform: `translateY(${row.start}px)` }
          if (row.index >= options.length) {
            return (
              <div
                key={row.key}
                role="presentation"
                className="absolute top-0 left-0 flex w-full items-center gap-2 px-1.5 text-sm text-muted-foreground"
                style={{ ...style, height: row.size }}
              >
                <LoaderCircleIcon className="size-4 animate-spin" />
                Memuat…
              </div>
            )
          }
          const option = options[row.index]
          return (
            <ComboboxItem
              key={row.key}
              ref={virtualizer.measureElement}
              index={row.index}
              data-index={row.index}
              value={option}
              disabled={isOptionDisabled?.(option)}
              aria-setsize={hasMore ? -1 : options.length}
              aria-posinset={row.index + 1}
              className="absolute top-0 left-0"
              style={style}
            >
              {renderOption(option)}
            </ComboboxItem>
          )
        })}
      </div>
    </div>
  )
}

type OptionSelectProps = Omit<SingleProps<SelectOption>, 'value' | 'onChange' | 'multiple' | 'options' | 'loadOptions'> & {
  value: string
  onChange: (value: string) => void
  options: Array<SelectOption>
}

export function OptionSelect({ value, onChange, options, ...rest }: OptionSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null
  return <Select<SelectOption> {...rest} options={options} value={selected} onChange={(option) => onChange(option?.value ?? '')} />
}
