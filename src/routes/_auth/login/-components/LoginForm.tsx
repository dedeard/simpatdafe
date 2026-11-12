import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DUMMY_CREDENTIALS, login, loginWithGitHub } from '@/lib/api/resources'
import { cn } from '@/lib/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useActionState, useTransition } from 'react'
import { AuthHeader, AuthSwitchLink, FormAlert, GitHubButton } from '../../-components'

type LoginState = { error?: string; email: string }

export function LoginForm({ className, ...props }: Omit<React.ComponentProps<'form'>, 'action'>) {
  const navigate = useNavigate()
  const [isGitHubPending, startGitHubTransition] = useTransition()
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get('email') ?? '')
      const result = await login({ email, password: String(formData.get('password') ?? '') })
      if (!result.ok) return { error: result.error, email }
      await navigate({ to: '/app/dashboard' })
      return { email }
    },
    { email: '' },
  )

  const handleGitHub = () =>
    startGitHubTransition(async () => {
      const result = await loginWithGitHub()
      if (result.ok) await navigate({ to: '/app/dashboard' })
    })

  const busy = isPending || isGitHubPending

  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <AuthHeader title="Login to your account" description="Enter your email below to login to your account" />
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Field data-invalid={!!state.error}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            defaultValue={state.email}
            aria-invalid={!!state.error}
            required
          />
        </Field>
        <Field data-invalid={!!state.error}>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link to="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={!!state.error} required />
        </Field>
        <Field>
          <Button type="submit" disabled={busy}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Login
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <GitHubButton label="Login with GitHub" onClick={handleGitHub} disabled={busy} />
          <AuthSwitchLink prompt="Don't have an account?" label="Sign up" to="/register" />
          <FieldDescription className="text-center text-xs">
            Demo: {DUMMY_CREDENTIALS.email} / {DUMMY_CREDENTIALS.password}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
