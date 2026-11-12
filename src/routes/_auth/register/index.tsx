import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from './-components'

export const Route = createFileRoute('/_auth/register/')({
  head: () => ({ meta: [{ title: 'Create account | simpatdafe' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  return <RegisterForm />
}
