import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '@/lib/api/resources'
import { cn } from '@/lib/utils'
import { Loader2Icon } from 'lucide-react'
import { useActionState } from 'react'
import { AuthHeader, AuthSwitchLink } from '../../-components'

type ForgotPasswordState = { sentTo?: string }

export function ForgotPasswordForm({ className, ...props }: Omit<React.ComponentProps<'form'>, 'action'>) {
  const [state, formAction, isPending] = useActionState<ForgotPasswordState, FormData>(async (_prev, formData) => {
    const result = await requestPasswordReset(String(formData.get('email') ?? ''))
    return { sentTo: result.email }
  }, {})

  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <AuthHeader title="Forgot your password?" description="Enter your email and we'll send you a reset link" />
        {state.sentTo ? (
          <FormAlert variant="success">
            If an account exists for <span className="font-medium">{state.sentTo}</span>, a reset link is on its way.
          </FormAlert>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="m@example.com" required />
            </Field>
            <Field>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="animate-spin" />}
                Send reset link
              </Button>
            </Field>
          </>
        )}
        <AuthSwitchLink prompt="Remembered it?" label="Back to login" to="/login" />
      </FieldGroup>
    </form>
  )
}
