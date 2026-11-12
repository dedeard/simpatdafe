import { cn } from '@/lib/utils'
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'

type FormAlertProps = React.ComponentProps<'div'> & { variant?: 'error' | 'success' }

export function FormAlert({ variant = 'error', className, children, ...props }: FormAlertProps) {
  const Icon = variant === 'error' ? CircleAlertIcon : CircleCheckIcon
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      data-slot="form-alert"
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        variant === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'bg-muted',
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
