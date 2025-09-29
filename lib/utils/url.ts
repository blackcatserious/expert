import { headers as nextHeaders } from 'next/headers'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DOMAIN_ONLY_REGEX = /^[A-Za-z0-9.-]+(:\d+)?$/

type HeaderLike = {
  get(name: string): string | null | undefined
}

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

function normaliseHostValue(host?: string | null) {
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

function buildHeaderDerivedUrl(headersList: HeaderLike) {
  const directBaseUrl = takePrimaryHeaderValue(headersList.get('x-base-url'))
  if (directBaseUrl) {
    try {
      return new URL(directBaseUrl)
    } catch (error) {
      console.warn('Invalid x-base-url header. Ignoring value.', error)
    }
  }

  const preconstructed = takePrimaryHeaderValue(headersList.get('x-url'))
  if (preconstructed) {
    try {
      return new URL(preconstructed)
    } catch (error) {
      console.warn('Invalid x-url header. Ignoring value.', error)
    }
  }

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
    'http'

  if (host) {
    const normalisedProtocol = protocol.replace(/:$/, '').trim().toLowerCase()
    const effectiveProtocol = normalisedProtocol || 'http'

    try {
      return new URL(`${effectiveProtocol}://${host}`)
    } catch (error) {
      console.warn('Unable to construct base URL from headers. Falling back.', error)
    }
  }

  return undefined
}

async function getHeaders(
  providedHeaders?: MaybePromise<HeaderLike | null | undefined>
): Promise<HeaderLike> {
  if (providedHeaders) {
    const resolved = isPromiseLike(providedHeaders)
      ? await providedHeaders
      : providedHeaders

    if (resolved && isHeaderLike(resolved)) {
      return resolved
    }
  }

  try {
    const nextResolved = nextHeaders()
    const resolvedNext = isPromiseLike(nextResolved)
      ? await nextResolved
      : nextResolved

    if (resolvedNext && isHeaderLike(resolvedNext)) {
      return resolvedNext
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
 */
export async function getBaseUrlFromHeaders(
  providedHeaders?: MaybePromise<HeaderLike | null | undefined>
): Promise<URL> {
  const headersList = await getHeaders(providedHeaders)

  return buildHeaderDerivedUrl(headersList) ?? fallbackBaseUrl()
}

/**
 * Resolves the base URL using environment variables or headers
 * Centralises the base URL resolution logic used across the application
 * @returns A URL object representing the base URL
 */
export async function getBaseUrl(
  providedHeaders?: MaybePromise<HeaderLike | null | undefined>
): Promise<URL> {
  const headersList = await getHeaders(providedHeaders)

  const forwardedHeader = headersList.get('forwarded')
  const forwardedHost = parseForwardedPart(forwardedHeader, 'host')

  const requestHost =
    forwardedHost ||
    takePrimaryHeaderValue(headersList.get('x-forwarded-host')) ||
    takePrimaryHeaderValue(headersList.get('x-host')) ||
    takePrimaryHeaderValue(headersList.get('host'))

  const normalisedRequestHost = normaliseHostValue(requestHost)

  const candidates = readBaseUrlCandidates()

  if (candidates.length > 0 && normalisedRequestHost) {
    const match = candidates.find(candidate => {
      const candidateHost = candidate.host.toLowerCase()
      const candidateHostname = candidate.hostname.toLowerCase()

      return (
        candidateHost === normalisedRequestHost.host ||
        candidateHostname === normalisedRequestHost.hostname
      )
    })

    if (match) {
      return new URL(match.toString())
    }
  }

  const headerDerived = buildHeaderDerivedUrl(headersList)

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
  providedHeaders?: MaybePromise<HeaderLike | null | undefined>
): Promise<string> {
  const baseUrl = await getBaseUrl(providedHeaders)
  return baseUrl.toString()
}
