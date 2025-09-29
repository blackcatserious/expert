import { headers as nextHeaders } from 'next/headers'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DOMAIN_ONLY_REGEX = /^[A-Za-z0-9.-]+(:\d+)?$/

let cachedBaseUrlEnv: string | undefined
let cachedBaseUrlCandidates: URL[] | undefined
let cachedDeploymentUrlEnv: string | undefined
let cachedDeploymentUrl: URL | undefined

function isStaticGenerationPhase() {
  const phase = process.env.NEXT_PHASE
  return phase === 'phase-production-build' || phase === 'phase-export'
}

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

function isDefaultPortForProtocol(port: string, protocol?: string) {
  if (!protocol) {
    return false
  }

  if (protocol === 'http' && port === '80') {
    return true
  }

  if (protocol === 'https' && port === '443') {
    return true
  }

  return false
}

function normalisePort(portValue?: string | null) {
  const primary = takePrimaryHeaderValue(portValue)

  if (!primary) {
    return undefined
  }

  const trimmed = primary.trim()

  if (!/^\d+$/.test(trimmed)) {
    return undefined
  }

  return trimmed
}

function mergeHostAndPort(
  hostValue?: string | null,
  port?: string,
  protocol?: string
) {
  if (!hostValue) {
    return undefined
  }

  const trimmedHost = hostValue.trim()

  if (!trimmedHost) {
    return undefined
  }

  if (!port) {
    return trimmedHost
  }

  try {
    const parsed = new URL(`http://${trimmedHost}`)
    if (parsed.port) {
      return trimmedHost
    }
  } catch {
    // If URL parsing fails we fall back to string heuristics below.
    if (trimmedHost.includes(':')) {
      return trimmedHost
    }
  }

  if (isDefaultPortForProtocol(port, protocol)) {
    return trimmedHost
  }

  return `${trimmedHost}:${port}`
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

function readBaseUrlEnvValue() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || ''
}

function readBaseUrlCandidates() {
  const baseUrlEnv = readBaseUrlEnvValue()

  if (cachedBaseUrlCandidates && baseUrlEnv === cachedBaseUrlEnv) {
    return cachedBaseUrlCandidates
  }

  if (!baseUrlEnv) {
    cachedBaseUrlEnv = baseUrlEnv
    cachedBaseUrlCandidates = []
    return cachedBaseUrlCandidates
  }

  const parsedCandidates = baseUrlEnv
    .split(',')
    .map(parseUrlCandidate)
    .filter((candidate): candidate is URL => Boolean(candidate))

  cachedBaseUrlEnv = baseUrlEnv
  cachedBaseUrlCandidates = parsedCandidates

  return parsedCandidates
}

function readDeploymentUrlEnvValue() {
  return process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || ''
}

function readDeploymentUrl(): URL | undefined {
  const deploymentEnv = readDeploymentUrlEnvValue()

  if (cachedDeploymentUrl && cachedDeploymentUrlEnv === deploymentEnv) {
    return cachedDeploymentUrl
  }

  if (!deploymentEnv) {
    cachedDeploymentUrlEnv = deploymentEnv
    cachedDeploymentUrl = undefined
    return undefined
  }

  try {
    const trimmed = deploymentEnv.trim()
    if (!trimmed) {
      cachedDeploymentUrlEnv = deploymentEnv
      cachedDeploymentUrl = undefined
      return undefined
    }

    const candidate = trimmed.includes('://')
      ? trimmed
      : `https://${trimmed}`

    const parsed = new URL(candidate)

    cachedDeploymentUrlEnv = deploymentEnv
    cachedDeploymentUrl = parsed

    return parsed
  } catch (error) {
    console.warn('Invalid deployment URL environment value. Ignoring.', error)
    cachedDeploymentUrlEnv = deploymentEnv
    cachedDeploymentUrl = undefined
    return undefined
  }
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

function isLocalHostname(hostname: string) {
  if (!hostname) {
    return false
  }

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return true
  }

  if (hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return true
  }

  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true
  }

  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    return true
  }

  return false
}

function inferProtocolForHost(host: NormalisedHost, protocol?: string) {
  if (protocol && protocol.length > 0) {
    return protocol
  }

  return isLocalHostname(host.hostname) ? 'http' : 'https'
}

function constructUrlFromHost(
  host: NormalisedHost,
  protocol?: string
): URL | undefined {
  const effectiveProtocol = inferProtocolForHost(host, protocol)

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

  const protocol =
    forwardedProto ||
    takePrimaryHeaderValue(headersList.get('x-forwarded-proto')) ||
    takePrimaryHeaderValue(headersList.get('x-protocol')) ||
    undefined
  const normalisedProtocol = normaliseProtocol(protocol)

  const forwardedPort =
    normalisePort(headersList.get('x-forwarded-port')) ||
    normalisePort(headersList.get('x-port')) ||
    undefined

  const rawHost =
    forwardedHost ||
    takePrimaryHeaderValue(headersList.get('x-forwarded-host')) ||
    takePrimaryHeaderValue(headersList.get('x-host')) ||
    takePrimaryHeaderValue(headersList.get('host'))

  const host = mergeHostAndPort(rawHost, forwardedPort, normalisedProtocol) || rawHost

  return {
    directUrl,
    host: normaliseHostValue(host),
    protocol: normalisedProtocol,
  }
}

function resolveUrlFromContext(
  context: ResolvedHeaderContext | undefined,
  candidates: URL[]
): URL | undefined {
  if (!context) {
    return undefined
  }

  const contextHost = context.host

  if (contextHost && candidates.length > 0) {
    const match = candidates.find(candidate => {
      const candidateHost = candidate.host.toLowerCase()
      const candidateHostname = candidate.hostname.toLowerCase()

      return (
        candidateHost === contextHost.host ||
        candidateHostname === contextHost.hostname
      )
    })

    if (match) {
      return new URL(match.toString())
    }
  }

  return (
    context.directUrl ??
    (contextHost ? constructUrlFromHost(contextHost, context.protocol) : undefined)
  )
}

async function resolveHeaderContextFromSources(
  providedHeaders: MaybePromise<HeaderSource | null | undefined> | undefined,
  { fallbackToNext }: { fallbackToNext: boolean }
): Promise<ResolvedHeaderContext | undefined> {
  const provided = await resolveProvidedHeaders(providedHeaders)

  if (provided) {
    return resolveHeaderContext(provided)
  }

  if (!fallbackToNext) {
    return undefined
  }

  if (isStaticGenerationPhase()) {
    return undefined
  }

  const next = await resolveNextHeaders()

  if (next) {
    return resolveHeaderContext(next)
  }

  return undefined
}

async function resolveProvidedHeaders(
  providedHeaders?: MaybePromise<HeaderSource | null | undefined>
): Promise<HeaderLike | undefined> {
  if (!providedHeaders) {
    return undefined
  }

  try {
    const resolved = isPromiseLike(providedHeaders)
      ? await providedHeaders
      : providedHeaders

    return toHeaderLike(resolved ?? undefined)
  } catch (error) {
    console.warn('Failed to resolve provided headers. Falling back.', error)
    return undefined
  }
}

async function resolveNextHeaders(): Promise<HeaderLike | undefined> {
  try {
    const nextResolved = nextHeaders()
    const resolvedNext = isPromiseLike(nextResolved)
      ? await nextResolved
      : nextResolved

    if (resolvedNext) {
      return toHeaderLike(resolvedNext) ?? undefined
    }
  } catch (error) {
    console.warn('Failed to resolve Next.js headers. Falling back.', error)
  }

  return undefined
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
  const context = await resolveHeaderContextFromSources(providedHeaders, {
    fallbackToNext: true,
  })

  const hostContext = context?.host
  const deploymentUrl = readDeploymentUrl()

  return (
    context?.directUrl ??
    (hostContext ? constructUrlFromHost(hostContext, context?.protocol) : undefined) ??
    deploymentUrl ??
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
  const candidates = readBaseUrlCandidates()
  const deploymentUrl = readDeploymentUrl()
  const initialContext = await resolveHeaderContextFromSources(providedHeaders, {
    fallbackToNext: false,
  })

  const initialResolved = resolveUrlFromContext(initialContext, candidates)
  if (initialResolved) {
    return initialResolved
  }

  const nextContext = await resolveHeaderContextFromSources(undefined, {
    fallbackToNext: true,
  })

  const nextResolved = resolveUrlFromContext(nextContext, candidates)
  if (nextResolved) {
    return nextResolved
  }

  if (candidates.length > 0) {
    return new URL(candidates[0].toString())
  }

  if (deploymentUrl) {
    return new URL(deploymentUrl.toString())
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

/**
 * Clears any memoised URL state so subsequent calls re-read environment values.
 * This is primarily useful for tests that mutate process.env between assertions.
 */
export function resetBaseUrlCache() {
  cachedBaseUrlEnv = undefined
  cachedBaseUrlCandidates = undefined
  cachedDeploymentUrlEnv = undefined
  cachedDeploymentUrl = undefined
}
