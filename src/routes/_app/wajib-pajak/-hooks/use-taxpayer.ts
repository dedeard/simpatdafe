import { getRouteApi } from '@tanstack/react-router'

const taxpayerRoute = getRouteApi('/_app/wajib-pajak/$id')

export function useTaxpayer() {
  return taxpayerRoute.useLoaderData()
}
