import { FieldDescription } from '@/components/ui/field'
import { Link, type LinkProps } from '@tanstack/react-router'

type AuthSwitchLinkProps = { prompt: string; label: string; to: LinkProps['to'] }

export function AuthSwitchLink({ prompt, label, to }: AuthSwitchLinkProps) {
  return (
    <FieldDescription className="text-center">
      {prompt}{' '}
      <Link to={to} className="underline underline-offset-4">
        {label}
      </Link>
    </FieldDescription>
  )
}
