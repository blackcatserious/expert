import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test'

mock.module('next/headers', () => ({
  headers: () => new Headers()
}))

type UrlModule = typeof import('./url')

let getBaseUrl: UrlModule['getBaseUrl']
let getBaseUrlFromHeaders: UrlModule['getBaseUrlFromHeaders']
let getBaseUrlString: UrlModule['getBaseUrlString']
let resetBaseUrlCache: UrlModule['resetBaseUrlCache']

const ORIGINAL_ENV = { ...process.env }

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

beforeAll(async () => {
  const urlModule = await import('./url')
  getBaseUrl = urlModule.getBaseUrl
  getBaseUrlFromHeaders = urlModule.getBaseUrlFromHeaders
  getBaseUrlString = urlModule.getBaseUrlString
  resetBaseUrlCache = urlModule.resetBaseUrlCache
})

afterEach(() => {
  restoreEnv()
  resetBaseUrlCache()
})

describe('getBaseUrl utilities', () => {
  it('falls back to the local development URL when no hints are present', async () => {
    delete process.env.BASE_URL
    delete process.env.NEXT_PUBLIC_BASE_URL
    delete process.env.VERCEL_URL
    delete process.env.NEXT_PUBLIC_VERCEL_URL

    const resolved = await getBaseUrl()

    expect(resolved.toString()).toBe('http://localhost:3000/')
  })

  it('prefers the first configured BASE_URL candidate when no headers match', async () => {
    process.env.BASE_URL = 'https://example.test, https://secondary.test'

    const resolved = await getBaseUrlString()

    expect(resolved).toBe('https://example.test/')
  })

  it('honours the explicit x-base-url header over other sources', async () => {
    const headers = new Headers({
      'x-base-url': 'https://header.example/path?q=1',
      host: 'ignored.test'
    })

    const resolvedFromHeaders = await getBaseUrlFromHeaders(headers)
    expect(resolvedFromHeaders.toString()).toBe(
      'https://header.example/path?q=1'
    )
  })

  it('constructs a URL from host and protocol headers when provided', async () => {
    const headers = new Headers({
      host: 'forwarded.example',
      'x-forwarded-proto': 'https'
    })

    const resolved = await getBaseUrl(headers)

    expect(resolved.toString()).toBe('https://forwarded.example/')
  })

  it('allows environment changes to be observed after resetting cached state', async () => {
    process.env.BASE_URL = 'https://first.example'
    await getBaseUrlString()

    process.env.BASE_URL = 'https://second.example'

    resetBaseUrlCache()
    const updated = await getBaseUrlString()

    expect(updated).toBe('https://second.example/')
  })
})
