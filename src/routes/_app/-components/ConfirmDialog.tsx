import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useSubmit } from '../-hooks'
import { TextAreaField } from './FormFields'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  askReason?: string
  onConfirm: (reason: string) => Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  askReason,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const { pending, error, run, setError } = useSubmit()

  const close = (next: boolean) => {
    if (!next) {
      setReason('')
      setError(undefined)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {askReason && <TextAreaField label={askReason} value={reason} onChange={setReason} required />}
        {error && <FormAlert>{error}</FormAlert>}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={pending}>
            Batal
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={() =>
              run(async () => {
                await onConfirm(reason)
                close(false)
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
