import { DateTimePicker } from '@/components/date-time-picker'
import { OptionSelect, Select, type SelectProps } from '@/components/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Option } from '@/lib/api/resources'
import { cn, formatNumber } from '@/lib/utils'
import { useId } from 'react'

type BaseProps = {
  label: string
  error?: string
  hint?: string
  className?: string
  required?: boolean
}

function Wrapper({ label, error, hint, className, required, id, children }: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}

type TextFieldProps = BaseProps &
  Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'className'> & { value: string; onChange: (value: string) => void }

export function TextField({ label, error, hint, className, required, value, onChange, ...input }: TextFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} {...input} />
    </Wrapper>
  )
}

type NumberFieldProps = BaseProps & {
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  step?: string
  suffix?: string
  min?: number
  max?: number
}

export function NumberField({
  label,
  error,
  hint,
  className,
  required,
  value,
  onChange,
  placeholder,
  step,
  suffix,
  min,
  max,
}: NumberFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          aria-invalid={Boolean(error)}
          className={cn(suffix && 'pr-14')}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </Wrapper>
  )
}

type MoneyFieldProps = BaseProps & { value: number | undefined; onChange: (value: number | undefined) => void; placeholder?: string }

export function MoneyField({ label, error, hint, className, required, value, onChange, placeholder }: MoneyFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
        <Input
          id={id}
          inputMode="numeric"
          value={value === undefined ? '' : formatNumber(value)}
          placeholder={placeholder}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            onChange(digits === '' ? undefined : Number(digits))
          }}
          aria-invalid={Boolean(error)}
          className="pl-9 tabular-nums"
        />
      </div>
    </Wrapper>
  )
}

type DateFieldProps = BaseProps & {
  value: string
  onChange: (value: string) => void
  type?: 'date' | 'month' | 'datetime-local'
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
}

export function DateField({
  label,
  error,
  hint,
  className,
  required,
  value,
  onChange,
  type = 'date',
  min,
  max,
  placeholder,
  disabled,
}: DateFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <DateTimePicker
        id={id}
        mode={type === 'datetime-local' ? 'datetime' : type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
        clearable={!required}
        aria-label={label || undefined}
        aria-invalid={Boolean(error)}
      />
    </Wrapper>
  )
}

type SelectFieldProps = BaseProps & {
  value: string
  onChange: (value: string) => void
  options: Array<Option>
  placeholder?: string
  disabled?: boolean
}

export function SelectField({
  label,
  error,
  hint,
  className,
  required,
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  disabled,
}: SelectFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <OptionSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        clearable={!required}
        aria-invalid={Boolean(error)}
      />
    </Wrapper>
  )
}

type AsyncSelectFieldProps<T> = Omit<BaseProps, 'className'> & SelectProps<T> & { fieldClassName?: string }

export function AsyncSelectField<T>({ label, error, hint, required, fieldClassName, ...select }: AsyncSelectFieldProps<T>) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={fieldClassName} required={required}>
      <Select id={id} aria-invalid={Boolean(error)} {...select} />
    </Wrapper>
  )
}

type TextAreaFieldProps = BaseProps & {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  required,
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled,
  maxLength,
}: TextAreaFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
    </Wrapper>
  )
}

export function ReadOnlyField({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm leading-snug font-medium">{label}</span>
      <div className="flex min-h-8 items-center rounded-lg border border-dashed bg-muted/40 px-2.5 text-sm tabular-nums">{value}</div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</CardContent>
    </Card>
  )
}

export function SummaryCard({
  title,
  rows,
  total,
  footer,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode }>
  total?: { label: string; value: React.ReactNode }
  footer?: React.ReactNode
}) {
  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-right tabular-nums">{r.value}</span>
          </div>
        ))}
        {total && (
          <div className="mt-1 flex items-start justify-between gap-4 border-t pt-3 text-base font-semibold">
            <span>{total.label}</span>
            <span className="text-right tabular-nums">{total.value}</span>
          </div>
        )}
        {footer && <div className="pt-2 text-xs text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  )
}
