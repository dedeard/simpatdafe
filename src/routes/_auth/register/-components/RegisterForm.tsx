import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { loginWithGitHub, register } from '@/lib/api/resources'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useActionState, useTransition } from 'react'
import { AuthHeader, AuthSwitchLink, FormAlert, GitHubButton } from '../../-components'

const MIN_PASSWORD_LENGTH = 8

type Values = { name: string; email: string }
type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>
type RegisterState = { values: Values; fieldErrors: FieldErrors; error?: string }

function validate(values: Values, password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.name.trim()) errors.name = 'Name is required.'
  if (!values.email.trim()) errors.email = 'Email is required.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export function RegisterForm({ className, ...props }: Omit<React.ComponentProps<'form'>, 'action'>) {
  const navigate = useNavigate()
  const [isGitHubPending, startGitHubTransition] = useTransition()
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    async (_prev, formData) => {
      const values = {
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
      }
      const password = String(formData.get('password') ?? '')
      const fieldErrors = validate(values, password, String(formData.get('confirmPassword') ?? ''))
      if (Object.keys(fieldErrors).length) return { values, fieldErrors }

      const result = await register({ ...values, password })
      if (!result.ok) return { values, fieldErrors: {}, error: result.error }
      await navigate({ to: '/login' })
      return { values, fieldErrors: {} }
    },
    { values: { name: '', email: '' }, fieldErrors: {} },
  )
  const { values, fieldErrors } = state

  const handleGitHub = () =>
    startGitHubTransition(async () => {
      const result = await loginWithGitHub()
      if (result.ok) await navigate({ to: '/app/dashboard' })
    })

  const busy = isPending || isGitHubPending

  return (
    <form action={formAction} noValidate className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <AuthHeader title="Create an account" description="Enter your details below to create your account" />
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Field data-invalid={!!fieldErrors.name}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="John Doe"
            defaultValue={values.name}
            aria-invalid={!!fieldErrors.name}
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            defaultValue={values.email}
            aria-invalid={!!fieldErrors.email}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!fieldErrors.password} />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : (
            <FieldDescription>Must be at least {MIN_PASSWORD_LENGTH} characters long.</FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!fieldErrors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirmPassword}
          />
          <FieldError>{fieldErrors.confirmPassword}</FieldError>
        </Field>
        <Field>
          <Button type="submit" disabled={busy}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Create account
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <GitHubButton label="Sign up with GitHub" onClick={handleGitHub} disabled={busy} />
          <AuthSwitchLink prompt="Already have an account?" label="Login" to="/login" />
        </Field>
      </FieldGroup>
    </form>
  )
}
