export function normalizeUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('file://')) {
    url = `https://${url.slice('file://'.length)}`
  } else if (url.startsWith('//')) {
    url = `https:${url}`
  } else if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  return url
}
