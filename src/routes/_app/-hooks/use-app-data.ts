import { getRouteApi } from '@tanstack/react-router'

const appRoute = getRouteApi('/_app')

export function useAppData() {
  return appRoute.useLoaderData()
}
