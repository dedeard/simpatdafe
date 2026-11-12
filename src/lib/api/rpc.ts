import { createServerFn } from '@tanstack/react-start'
import type { Handlers } from './dummy/handlers'

type RpcInput = { name: string; args: unknown }

const rpc = createServerFn({ method: 'POST' })
  .validator((input: RpcInput) => input)
  .handler(async ({ data }) => {
    const { handlers } = await import('./dummy/handlers')
    const handler = (handlers as Record<string, ((args: unknown) => unknown) | undefined>)[data.name]
    if (!handler) throw new Error(`Unknown API handler: ${data.name}`)
    return handler(data.args) as Promise<never>
  })

export function call<K extends keyof Handlers>(name: K, ...args: Parameters<Handlers[K]>): Promise<Awaited<ReturnType<Handlers[K]>>> {
  return rpc({ data: { name, args: args[0] } }) as Promise<Awaited<ReturnType<Handlers[K]>>>
}
