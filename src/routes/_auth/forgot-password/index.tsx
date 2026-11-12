import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from './-components'

export const Route = createFileRoute('/_auth/forgot-password/')({
  head: () => ({ meta: [{ title: 'Forgot password | simpatdafe' }] }),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
