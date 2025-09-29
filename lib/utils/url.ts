import { headers } from 'next/headers'

const DEFAULT_BASE_URL_STRING = 'http://localhost:3000'
const DOMAIN_ONLY_REGEX = /^[A-Za-z0-9.-]+(:\d+)?$/

function takeFirstHeaderValue(value?: string | null) {
  if (!value) {
    return undefined
  }

  const firstValue = value.split(',')[0]?.trim()
  return firstValue || undefined
}

function normaliseHost(host?: string | null) {
  const primaryHost = takeFirstHeaderValue(host)

  if (!primaryHost) {
    return undefined
  }

  try {
    const parsedHost = new URL(`http://${primaryHost}`)
    return {
      host: parsedHost.host.toLowerCase(),
      hostname: parsedHost.hostname.toLowerCase(),
    }
  } catch {
    const trimmedHost = primaryHost.trim().toLowerCase()

    if (!trimmedHost) {
      return undefined
    }

    const [hostname] = trimmedHost.split(':')
    return {
      host: trimmedHost,
      hostname,
    }
  }
}

function buildUrl(candidate: string): URL | undefined {
  const trimmedCandidate = candidate.trim()

  if (!trimmedCandidate) {
    return undefined
  }

  try {
    return new URL(trimmedCandidate)
  } catch (primaryError) {
    if (DOMAIN_ONLY_REGEX.test(trimmedCandidate)) {
      try {
        return new URL(`https://${trimmedCandidate}`)
      } catch (secondaryError) {
        // Fall through to warn below
      }
    }

    console.warn(
      `Invalid BASE_URL candidate "${trimmedCandidate}". Ignoring this value.`,
      primaryError
    )
    return undefined
  }
}

function parseBaseUrlCandidates(baseUrlEnv: string | undefined): URL[] {
  if (!baseUrlEnv) {
    return []
  }

  return baseUrlEnv
    .split(',')
    .map(buildUrl)
    .filter((candidate): candidate is URL => Boolean(candidate))
}

function parseForwardedHeader(
  forwardedHeader: string | null,
  key: 'host' | 'proto'
): string | undefined {
  const primaryForwarded = takeFirstHeaderValue(forwardedHeader)

  if (!primaryForwarded) {
    return undefined
  }

  for (const part of primaryForwarded.split(';')) {
    const [rawKey, ...rawValueParts] = part.split('=')
    if (!rawKey || rawValueParts.length === 0) {
      continue
    }

    if (rawKey.trim().toLowerCase() === key) {
      const rawValue = rawValueParts.join('=')
      const cleanedValue = rawValue.trim().replace(/^"|"$/g, '')
      return cleanedValue || undefined
    }
  }

  return undefined
}

function ensureProtocol(protocol: string | undefined | null) {
  const primaryProtocol = takeFirstHeaderValue(protocol)

  if (!primaryProtocol) {
    return 'http'
  }

  const trimmedProtocol = primaryProtocol.trim().toLowerCase()

  if (!trimmedProtocol) {
    return 'http'
  }

  return trimmedProtocol.replace(/:$/, '')
}

function fallbackBaseUrl() {
  return new URL(DEFAULT_BASE_URL_STRING)
}

function resolveBaseUrlFromHeadersList(
  headersList: Headers
): URL | undefined {
  const directBaseUrl = takeFirstHeaderValue(headersList.get('x-base-url'))
  if (directBaseUrl) {
    try {
      return new URL(directBaseUrl)
    } catch (error) {
      console.warn('Invalid x-base-url header. Ignoring value.', error)
    }
  }

  const preConstructedUrl = takeFirstHeaderValue(headersList.get('x-url'))
  if (preConstructedUrl) {
    try {
      return new URL(preConstructedUrl)
    } catch (error) {
      console.warn('Invalid x-url header. Ignoring value.', error)
    }
  }

  const forwardedHeader = headersList.get('forwarded')
  const forwardedHost = parseForwardedHeader(forwardedHeader, 'host')
  const forwardedProto = parseForwardedHeader(forwardedHeader, 'proto')

  const host =
    forwardedHost ||
    takeFirstHeaderValue(headersList.get('x-forwarded-host')) ||
    takeFirstHeaderValue(headersList.get('x-host')) ||
    takeFirstHeaderValue(headersList.get('host'))

  const protocol = ensureProtocol(
    forwardedProto ||
      headersList.get('x-forwarded-proto') ||
      headersList.get('x-protocol')
  )

  if (host) {
    try {
      return new URL(`${protocol}://${host}`)
    } catch (error) {
      console.warn('Unable to construct base URL from headers. Falling back.', error)
    }
  }

  return undefined
}

/**
 * Helper function to get base URL from headers
 * Extracts URL information from Next.js request headers
 */
export async function getBaseUrlFromHeaders(
  providedHeaders?: Headers
): Promise<URL> {
  const headersList = providedHeaders ?? (await headers())

  return resolveBaseUrlFromHeadersList(headersList) ?? fallbackBaseUrl()
}

/**
 * Resolves the base URL using environment variables or headers
 * Centralises the base URL resolution logic used across the application
 * @returns A URL object representing the base URL
 */
export async function getBaseUrl(providedHeaders?: Headers): Promise<URL> {
  const headersList = providedHeaders ?? (await headers())
  const forwardedHeader = headersList.get('forwarded')
  const forwardedHost = parseForwardedHeader(forwardedHeader, 'host')
  const hostFromHeaders =
    forwardedHost ||
    takeFirstHeaderValue(headersList.get('x-forwarded-host')) ||
    takeFirstHeaderValue(headersList.get('x-host')) ||
    takeFirstHeaderValue(headersList.get('host')) ||
    undefined

  const baseUrlEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL
  const baseUrlCandidates = parseBaseUrlCandidates(baseUrlEnv)

  if (baseUrlCandidates.length > 0) {
    const normalisedRequestHost = normaliseHost(hostFromHeaders)

    if (normalisedRequestHost) {
      const matchingCandidate = baseUrlCandidates.find(candidate => {
        const candidateHost = candidate.host.toLowerCase()
        const candidateHostname = candidate.hostname.toLowerCase()

        return (
          candidateHost === normalisedRequestHost.host ||
          candidateHostname === normalisedRequestHost.hostname
        )
      })

      if (matchingCandidate) {
        return new URL(matchingCandidate.toString())
      }

      const headerDerivedUrl = resolveBaseUrlFromHeadersList(headersList)
      if (headerDerivedUrl) {
        return headerDerivedUrl
      }

      return new URL(baseUrlCandidates[0].toString())
    }

    return new URL(baseUrlCandidates[0].toString())
  }

  return getBaseUrlFromHeaders(headersList)
}

/**
 * Gets the base URL as a string
 * Convenience wrapper around getBaseUrl that returns a string
 * @returns A string representation of the base URL
 */
export async function getBaseUrlString(
  providedHeaders?: Headers
): Promise<string> {
  const baseUrlObj = await getBaseUrl(providedHeaders)
  return baseUrlObj.toString()
}
