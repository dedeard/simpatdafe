export function toSlug(id: string) {
  return id.replaceAll('/', '~')
}

export function fromSlug(slug: string) {
  return slug.replaceAll('~', '/')
}
