export type AuthUser = {
  id: string
  name: string
  email: string
}

type DummyAccount = AuthUser & { password: string }

export type LoginInput = { email: string; password: string }
export type RegisterInput = { name: string; email: string; password: string }

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string }

export const DUMMY_LATENCY_MS = 600

// TODO: replace with real API calls once the backend exists
const dummyAccounts: Array<DummyAccount> = [
  { id: 'u_1', name: 'Admin Demo', email: 'admin@simpatdafe.test', password: 'password123' },
  { id: 'u_2', name: 'User Demo', email: 'user@simpatdafe.test', password: 'password123' },
]

export const DUMMY_CREDENTIALS = { email: dummyAccounts[0].email, password: dummyAccounts[0].password }

export const DUMMY_CURRENT_USER = { ...toUser(dummyAccounts[0]), role: 'Operator BP2RD' }

function wait(ms = DUMMY_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toUser({ id, name, email }: DummyAccount): AuthUser {
  return { id, name, email }
}

function findAccount(email: string) {
  return dummyAccounts.find((account) => account.email.toLowerCase() === email.trim().toLowerCase())
}

export async function login({ email, password }: LoginInput): Promise<AuthResult> {
  await wait()
  const account = findAccount(email)
  if (!account || account.password !== password) {
    return { ok: false, error: 'Invalid email or password.' }
  }
  return { ok: true, user: toUser(account) }
}

export async function loginWithGitHub(): Promise<AuthResult> {
  await wait()
  return { ok: true, user: toUser(dummyAccounts[0]) }
}

export async function register({ name, email, password }: RegisterInput): Promise<AuthResult> {
  await wait()
  if (findAccount(email)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  const account: DummyAccount = { id: `u_${dummyAccounts.length + 1}`, name: name.trim(), email: email.trim(), password }
  dummyAccounts.push(account)
  return { ok: true, user: toUser(account) }
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; email: string }> {
  await wait()
  // Always succeed so the response never reveals which emails are registered
  return { ok: true, email: email.trim() }
}
