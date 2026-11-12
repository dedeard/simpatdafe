import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
import { useId } from 'react'

type OptionGroupProps<T extends string | number> = {
  legend: string
  value: T
  options: Array<{ value: T; label: string; content: React.ReactNode }>
  onChange: (value: T) => void
  className?: string
}

export function OptionGroup<T extends string | number>({ legend, value, options, onChange, className }: OptionGroupProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn('grid gap-3', className)}>
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label key={String(option.value)} className="group/option flex cursor-pointer flex-col gap-1.5">
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <div className="relative rounded-lg border bg-card p-1.5 transition-colors group-hover/option:border-foreground/25 peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/25 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {option.content}
                {checked && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" />
                  </span>
                )}
              </div>
              <span className="text-center text-xs text-muted-foreground peer-checked:font-medium peer-checked:text-foreground">
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
