export function setupDevProxyHook() {
  const originFetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === 'string' ? input : input.toString()
    if (/^https?:\/\//.test(url) || /^http?:\/\//.test(url)) {
      url = `/proxy?url=${encodeURIComponent(url)}`
    }
    return originFetch.call(this, url, init)
  }

  const originOpen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null | undefined,
    password?: string | null | undefined,
  ) {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      url = `/proxy?url=${encodeURIComponent(url)}`
    }
    return originOpen.call(this, method, url, !!async, username, password)
  }

  const rewrite = (url: string) => {
    if (/^http?:\/\//.test(url) || /^https?:\/\//.test(url)) {
      return `/proxy?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    set(value) {
      value = rewrite(value)
      return desc!.set!.call(this, value)
    },
  })
}
