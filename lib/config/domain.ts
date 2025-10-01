export type DomainConfiguration = {
  defaultIncludeDomains: string[]
  defaultExcludeDomains: string[]
  agentInstructions?: string
}

const LIST_SPLIT_REGEX = /[,\n]/

function sanitiseDomainEntry(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }

  const hasWildcard = trimmed.startsWith('*.')
  const withoutWildcard = hasWildcard ? trimmed.slice(2) : trimmed

  const withoutScheme = withoutWildcard.replace(/^https?:\/\//i, '')
  const withoutPath = withoutScheme.replace(/[#/?].*$/, '')

  const cleaned = withoutPath.toLowerCase()
  if (!cleaned) {
    return ''
  }

  return hasWildcard ? `*.${cleaned}` : cleaned
}

function normaliseDomains(domains: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const domain of domains) {
    const cleaned = sanitiseDomainEntry(domain)
    if (!cleaned || seen.has(cleaned)) {
      continue
    }
    seen.add(cleaned)
    result.push(cleaned)
  }

  return result
}

function getFirstEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function parseListFromString(raw?: string) {
  if (!raw) {
    return []
  }

  const entries = raw
    .split(LIST_SPLIT_REGEX)
    .map(part => part.trim())
    .filter(Boolean)

  return normaliseDomains(entries)
}

export function normaliseDomainList(input: unknown) {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return normaliseDomains(
      input.map(item => (typeof item === 'string' ? item : ''))
    )
  }

  if (typeof input === 'string') {
    return parseListFromString(input)
  }

  return []
}

export function hostMatchesConfiguredDomain(
  hostname: string,
  configured: string
) {
  if (!hostname || !configured) {
    return false
  }

  const lowerHost = hostname.toLowerCase()
  const hasWildcard = configured.startsWith('*.')
  const domain = hasWildcard ? configured.slice(2) : configured

  if (!domain) {
    return false
  }

  if (lowerHost === domain) {
    return true
  }

  return lowerHost.endsWith(`.${domain}`)
}

let cachedConfiguration: DomainConfiguration | undefined

function buildDomainConfiguration(): DomainConfiguration {
  const defaultIncludeRaw = getFirstEnvValue([
    'DEFAULT_INCLUDE_DOMAINS',
    'NEXT_PUBLIC_DEFAULT_INCLUDE_DOMAINS'
  ])

  const defaultExcludeRaw = getFirstEnvValue([
    'DEFAULT_EXCLUDE_DOMAINS',
    'NEXT_PUBLIC_DEFAULT_EXCLUDE_DOMAINS'
  ])

  const instructionsRaw = getFirstEnvValue([
    'DOMAIN_AGENT_INSTRUCTIONS',
    'NEXT_PUBLIC_DOMAIN_AGENT_INSTRUCTIONS'
  ])

  return {
    defaultIncludeDomains: parseListFromString(defaultIncludeRaw),
    defaultExcludeDomains: parseListFromString(defaultExcludeRaw),
    agentInstructions: instructionsRaw?.trim() || undefined
  }
}

export function getDomainConfiguration(): DomainConfiguration {
  if (!cachedConfiguration) {
    cachedConfiguration = buildDomainConfiguration()
  }

  return cachedConfiguration
}

export function resetDomainConfigurationCache() {
  cachedConfiguration = undefined
}

export function appendDomainInstructions(basePrompt: string) {
  const configuration = getDomainConfiguration()
  if (!configuration.agentInstructions) {
    return basePrompt
  }

  const trimmedBase = basePrompt.trimEnd()
  const separator = trimmedBase.length ? '\n\n' : ''
  return `${trimmedBase}${separator}Domain-specific instructions:\n${configuration.agentInstructions}`
}
