import { headers } from 'next/headers'

function parseBaseUrlCandidates(baseUrlEnv: string | undefined) {
  if (!baseUrlEnv) {
    return [] as string[]
  }

  return baseUrlEnv
    .split(',')
    .map(candidate => candidate.trim())
    .filter(candidate => candidate.length > 0)
}

/**
 * Helper function to get base URL from headers
 * Extracts URL information from Next.js request headers
 */
export async function getBaseUrlFromHeaders(
  providedHeaders?: Headers
): Promise<URL> {
  const headersList = providedHeaders ?? (await headers())
  const baseUrl = headersList.get('x-base-url')
  const url = headersList.get('x-url')
  const host = headersList.get('x-host')
  const protocol = headersList.get('x-protocol') || 'http:'

  try {
    // Try to use the pre-constructed base URL if available
    if (baseUrl) {
      return new URL(baseUrl)
    } else if (url) {
      return new URL(url)
    } else if (host) {
      const constructedUrl = `${protocol}${
        protocol.endsWith(':') ? '//' : '://'
      }${host}`
      return new URL(constructedUrl)
    } else {
      return new URL('http://localhost:3000')
    }
  } catch (urlError) {
    // Fallback to default URL if any error occurs during URL construction
    return new URL('http://localhost:3000')
  }
}

/**
 * Resolves the base URL using environment variables or headers
 * Centralizes the base URL resolution logic used across the application
 * @returns A URL object representing the base URL
 */
export async function getBaseUrl(): Promise<URL> {
  const headersList = await headers()
  const hostFromHeaders =
    headersList.get('x-host') || headersList.get('host') || undefined

  // Check for environment variables first
  const baseUrlEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL
  const baseUrlCandidates = parseBaseUrlCandidates(baseUrlEnv)

  if (baseUrlCandidates.length > 0) {
    const matchingCandidate = baseUrlCandidates.find(candidate => {
      try {
        const parsedCandidate = new URL(candidate)
        return hostFromHeaders
          ? parsedCandidate.host === hostFromHeaders
          : false
      } catch (error) {
        console.warn(
          `Invalid BASE_URL candidate "${candidate}". Ignoring this value.`
        )
        return false
      }
    })

    if (matchingCandidate) {
      console.log('Using BASE_URL matched to host:', matchingCandidate)
      return new URL(matchingCandidate)
    }

    try {
      console.log('Using BASE_URL environment variable:', baseUrlCandidates[0])
      return new URL(baseUrlCandidates[0])
    } catch (error) {
      console.warn(
        'Invalid BASE_URL environment variable, falling back to headers'
      )
    }
  }

  // If no valid environment variable is available, use headers
  return await getBaseUrlFromHeaders(headersList)
}

/**
 * Gets the base URL as a string
 * Convenience wrapper around getBaseUrl that returns a string
 * @returns A string representation of the base URL
 */
export async function getBaseUrlString(): Promise<string> {
  const baseUrlObj = await getBaseUrl()
  return baseUrlObj.toString()
}
