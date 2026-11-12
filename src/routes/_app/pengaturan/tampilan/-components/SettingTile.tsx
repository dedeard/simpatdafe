import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TileOption<T> = { value: T; label: string; hint?: string; fontFamily?: string }

type SettingTileProps<T extends string | number> = {
  label: string
  value: T
  options: Array<TileOption<T>>
  onChange: (value: T) => void
  icon: React.ReactNode
}

export function SettingTile<T extends string | number>({ label, value, options, onChange, icon }: SettingTileProps<T>) {
  const current = options.find((option) => option.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted/50"
          />
        }
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="truncate text-sm font-medium" style={{ fontFamily: current?.fontFamily }}>
            {current?.label}
            {current?.hint && <span className="font-normal text-muted-foreground"> ({current.hint})</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4" style={{ fontFamily: current?.fontFamily }}>
          {icon}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={String(value)}
          onValueChange={(next: string) => {
            const option = options.find((o) => String(o.value) === next)
            if (option) onChange(option.value)
          }}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={String(option.value)} value={String(option.value)} style={{ fontFamily: option.fontFamily }}>
              {option.label}
              {option.hint && <span className="ml-auto pl-3 text-xs text-muted-foreground">{option.hint}</span>}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
