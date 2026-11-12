import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from './-components'

export const Route = createFileRoute('/_auth/login/')({
  head: () => ({ meta: [{ title: 'Login | simpatdafe' }] }),
  component: LoginPage,
})

function LoginPage() {
  return <LoginForm />
}
