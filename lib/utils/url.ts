import { headers as nextHeaders } from 'next/headers'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DOMAIN_ONLY_REGEX = /^[A-Za-z0-9.-]+(:\d+)?$/

type NormalisedHost = {
  host: string
  hostname: string
}

type HeaderLike = {
  get(name: string): string | null | undefined
}

type HeaderSource =
  | HeaderLike
  | Headers
  | HeadersInit
  | Request
  | Response
  | { headers?: HeaderSource | null | undefined }

type MaybePromise<T> = T | Promise<T>

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}

function isHeaderLike(value: unknown): value is HeaderLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as HeaderLike).get === 'function'
  )
}

function isHeadersInstance(value: unknown): value is Headers {
  return typeof Headers !== 'undefined' && value instanceof Headers
}

function hasHeadersProperty(value: unknown): value is { headers: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'headers' in (value as { headers?: unknown })
  )
}

function toHeaderLike(value: HeaderSource | null | undefined): HeaderLike | undefined {
  if (!value) {
    return undefined
  }

  if (isHeaderLike(value)) {
    return value
  }

  if (isHeadersInstance(value)) {
    return value
  }

  if (hasHeadersProperty(value)) {
    return toHeaderLike(value.headers as HeaderSource)
  }

  try {
    return new Headers(value as HeadersInit)
  } catch {
    return undefined
  }
}

function takePrimaryHeaderValue(value?: string | null) {
  if (!value) {
    return undefined
  }

  const primary = value.split(',')[0]?.trim()
  return primary || undefined
}

function parseForwardedPart(
  forwardedHeader: string | null | undefined,
  key: 'host' | 'proto'
) {
  const primaryForwarded = takePrimaryHeaderValue(forwardedHeader)

  if (!primaryForwarded) {
    return undefined
  }

  for (const part of primaryForwarded.split(';')) {
    const [rawKey, ...rawValueParts] = part.split('=')
    if (!rawKey || rawValueParts.length === 0) {
      continue
    }

    if (rawKey.trim().toLowerCase() !== key) {
      continue
    }

    const rawValue = rawValueParts.join('=')
    const cleaned = rawValue.trim().replace(/^"|"$/g, '')
    return cleaned || undefined
  }

  return undefined
}

function normaliseHostValue(host?: string | null): NormalisedHost | undefined {
  const primaryHost = takePrimaryHeaderValue(host)

  if (!primaryHost) {
    return undefined
  }

  try {
    const parsed = new URL(`http://${primaryHost}`)
    return {
      host: parsed.host.toLowerCase(),
      hostname: parsed.hostname.toLowerCase(),
    }
  } catch {
    const trimmed = primaryHost.trim().toLowerCase()

    if (!trimmed) {
      return undefined
    }

    const [hostname] = trimmed.split(':')
    return {
      host: trimmed,
      hostname,
    }
  }
}

function parseUrlCandidate(candidate: string) {
  const trimmed = candidate.trim()

  if (!trimmed) {
    return undefined
  }

  try {
    return new URL(trimmed)
  } catch (primaryError) {
    if (DOMAIN_ONLY_REGEX.test(trimmed)) {
      try {
        return new URL(`https://${trimmed}`)
      } catch (secondaryError) {
        console.warn(
          `Invalid BASE_URL candidate "${trimmed}". Ignoring this value.`,
          secondaryError
        )
        return undefined
      }
    }

    console.warn(
      `Invalid BASE_URL candidate "${trimmed}". Ignoring this value.`,
      primaryError
    )
    return undefined
  }
}

function readBaseUrlCandidates() {
  const baseUrlEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL

  if (!baseUrlEnv) {
    return []
  }

  return baseUrlEnv
    .split(',')
    .map(parseUrlCandidate)
    .filter((candidate): candidate is URL => Boolean(candidate))
}

function normaliseProtocol(protocol?: string | null) {
  if (!protocol) {
    return undefined
  }

  const cleaned = protocol.replace(/:$/, '').trim().toLowerCase()
  return cleaned || undefined
}

function parseHeaderUrl(
  headersList: HeaderLike,
  headerName: string,
  description: string
) {
  const value = takePrimaryHeaderValue(headersList.get(headerName))

  if (!value) {
    return undefined
  }

  try {
    return new URL(value)
  } catch (error) {
    console.warn(`Invalid ${description}. Ignoring value.`, error)
    return undefined
  }
}

function constructUrlFromHost(
  host: NormalisedHost,
  protocol?: string
): URL | undefined {
  const effectiveProtocol = protocol && protocol.length > 0 ? protocol : 'http'

  try {
    return new URL(`${effectiveProtocol}://${host.host}`)
  } catch (error) {
    console.warn('Unable to construct base URL from headers. Falling back.', error)
    return undefined
  }
}

type ResolvedHeaderContext = {
  directUrl?: URL
  host?: NormalisedHost
  protocol?: string
}

function resolveHeaderContext(headersList: HeaderLike): ResolvedHeaderContext {
  const directUrl =
    parseHeaderUrl(headersList, 'x-base-url', 'x-base-url header') ??
    parseHeaderUrl(headersList, 'x-url', 'x-url header')

  const forwardedHeader = headersList.get('forwarded')
  const forwardedHost = parseForwardedPart(forwardedHeader, 'host')
  const forwardedProto = parseForwardedPart(forwardedHeader, 'proto')

  const host =
    forwardedHost ||
    takePrimaryHeaderValue(headersList.get('x-forwarded-host')) ||
    takePrimaryHeaderValue(headersList.get('x-host')) ||
    takePrimaryHeaderValue(headersList.get('host'))

  const protocol =
    forwardedProto ||
    takePrimaryHeaderValue(headersList.get('x-forwarded-proto')) ||
    takePrimaryHeaderValue(headersList.get('x-protocol')) ||
    undefined

  return {
    directUrl,
    host: normaliseHostValue(host),
    protocol: normaliseProtocol(protocol),
  }
}

async function getHeaders(
  providedHeaders?: MaybePromise<HeaderSource | null | undefined>
): Promise<HeaderLike> {
  if (providedHeaders) {
    const resolved = isPromiseLike(providedHeaders)
      ? await providedHeaders
      : providedHeaders

    const headerLike = toHeaderLike(resolved ?? undefined)
    if (headerLike) {
      return headerLike
    }
  }

  try {
    const nextResolved = nextHeaders()
    const resolvedNext = isPromiseLike(nextResolved)
      ? await nextResolved
      : nextResolved

    if (resolvedNext) {
      const headerLike = toHeaderLike(resolvedNext)
      if (headerLike) {
        return headerLike
      }
    }
  } catch (error) {
    console.warn('Failed to resolve Next.js headers. Falling back.', error)
  }

  return new Headers()
}

function fallbackBaseUrl() {
  return new URL(DEFAULT_BASE_URL)
}

/**
 * Helper function to get base URL from headers
 * Extracts URL information from Next.js request headers
 * Accepts Next.js `headers()`, native `Request` objects or any `HeadersInit` source.
 */
export async function getBaseUrlFromHeaders(
  providedHeaders?: MaybePromise<HeaderSource | null | undefined>
): Promise<URL> {
  const headersList = await getHeaders(providedHeaders)
  const context = resolveHeaderContext(headersList)

  return (
    context.directUrl ??
    (context.host ? constructUrlFromHost(context.host, context.protocol) : undefined) ??
    fallbackBaseUrl()
  )
}

/**
 * Resolves the base URL using environment variables or headers
 * Centralises the base URL resolution logic used across the application
 * Accepts the same flexible header inputs as {@link getBaseUrlFromHeaders}.
 * @returns A URL object representing the base URL
 */
export async function getBaseUrl(
  providedHeaders?: MaybePromise<HeaderSource | null | undefined>
): Promise<URL> {
  const headersList = await getHeaders(providedHeaders)
  const context = resolveHeaderContext(headersList)
  const candidates = readBaseUrlCandidates()

  if (candidates.length > 0 && context.host) {
    const match = candidates.find(candidate => {
      const candidateHost = candidate.host.toLowerCase()
      const candidateHostname = candidate.hostname.toLowerCase()

      return (
        candidateHost === context.host.host ||
        candidateHostname === context.host.hostname
      )
    })

    if (match) {
      return new URL(match.toString())
    }
  }

  const headerDerived =
    context.directUrl ||
    (context.host ? constructUrlFromHost(context.host, context.protocol) : undefined)

  if (headerDerived) {
    return headerDerived
  }

  if (candidates.length > 0) {
    return new URL(candidates[0].toString())
  }

  return fallbackBaseUrl()
}

/**
 * Gets the base URL as a string
 * Convenience wrapper around getBaseUrl that returns a string
 * @returns A string representation of the base URL
 */
export async function getBaseUrlString(
  providedHeaders?: MaybePromise<HeaderSource | null | undefined>
): Promise<string> {
  const baseUrl = await getBaseUrl(providedHeaders)
  return baseUrl.toString()
}
